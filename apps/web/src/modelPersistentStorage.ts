// BESHMARAI_OPFS_MODEL_STORAGE_V1

export type PersistentModelDescriptor = {
  id: string
  label: string
  sourceUrl: string
  keyVersion: string
  encryptedBytes: number
  encryptedSha256: string
  magic: string
}

export type PersistentModelProgress = {
  stage:
    | 'checking'
    | 'downloading'
    | 'retrying'
    | 'verifying'
    | 'ready'
  loadedBytes: number
  totalBytes: number
  percent: number
  attempt: number
  fromDisk: boolean
  message: string
}

type OpfsStorageManager =
  StorageManager & {
    getDirectory?: () =>
      Promise<FileSystemDirectoryHandle>
  }

const directoryName =
  'beshmarai-models-v1'

const inactivityTimeoutMs =
  35_000

const maximumAttempts = 3

const activePreparations =
  new Map<
    string,
    Promise<void>
  >()

function emit(
  descriptor:
    PersistentModelDescriptor,
  listener:
    | ((
        progress:
          PersistentModelProgress,
      ) => void)
    | undefined,
  stage:
    PersistentModelProgress['stage'],
  loadedBytes: number,
  attempt: number,
  fromDisk: boolean,
  message: string,
): void {
  const normalizedLoaded =
    Math.min(
      descriptor.encryptedBytes,
      Math.max(
        0,
        loadedBytes,
      ),
    )

  listener?.({
    stage,
    loadedBytes:
      normalizedLoaded,
    totalBytes:
      descriptor.encryptedBytes,
    percent:
      descriptor.encryptedBytes > 0
        ? Math.round(
            normalizedLoaded /
              descriptor.encryptedBytes *
              100,
          )
        : 100,
    attempt,
    fromDisk,
    message,
  })
}

function storageManager():
  OpfsStorageManager {
  return navigator.storage as
    OpfsStorageManager
}

function opfsIsAvailable():
  boolean {
  return (
    typeof storageManager()
      .getDirectory ===
    'function'
  )
}

function fileName(
  descriptor:
    PersistentModelDescriptor,
): string {
  return (
    `${descriptor.id}-` +
    `${descriptor.keyVersion}-` +
    `${descriptor.encryptedSha256.slice(0, 20)}.bdm`
  )
}

async function requestPersistence():
  Promise<void> {
  try {
    await navigator.storage
      ?.persist?.()
  } catch {
    // Persistent mode is best effort.
    // OPFS still survives normal reloads.
  }
}

async function modelDirectory():
  Promise<FileSystemDirectoryHandle> {
  const getDirectory =
    storageManager()
      .getDirectory

  if (!getDirectory) {
    throw new Error(
      'ذخیره دائمی مدل روی حافظه داخلی در این مرورگر پشتیبانی نمی‌شود.',
    )
  }

  const root =
    await getDirectory.call(
      navigator.storage,
    )

  return root.getDirectoryHandle(
    directoryName,
    {
      create: true,
    },
  )
}

async function modelFileHandle(
  descriptor:
    PersistentModelDescriptor,
  create: boolean,
): Promise<
  FileSystemFileHandle | null
> {
  try {
    const directory =
      await modelDirectory()

    return await directory
      .getFileHandle(
        fileName(descriptor),
        {
          create,
        },
      )
  } catch (error: unknown) {
    if (
      error instanceof DOMException &&
      error.name ===
        'NotFoundError'
    ) {
      return null
    }

    throw error
  }
}

async function readStoredFileInfo(
  descriptor:
    PersistentModelDescriptor,
): Promise<{
  handle:
    FileSystemFileHandle | null
  file: File | null
  valid: boolean
}> {
  const handle =
    await modelFileHandle(
      descriptor,
      false,
    )

  if (!handle) {
    return {
      handle: null,
      file: null,
      valid: false,
    }
  }

  const file =
    await handle.getFile()

  if (
    file.size !==
    descriptor.encryptedBytes
  ) {
    return {
      handle,
      file,
      valid: false,
    }
  }

  const magic =
    await file.slice(
      0,
      descriptor.magic.length,
    ).text()

  return {
    handle,
    file,
    valid:
      magic ===
      descriptor.magic,
  }
}

function copyArrayBuffer(
  bytes: Uint8Array,
): ArrayBuffer {
  const copy =
    new Uint8Array(
      bytes.byteLength,
    )

  copy.set(bytes)

  return copy.buffer
}

function delay(
  milliseconds: number,
): Promise<void> {
  return new Promise(
    (resolve) => {
      window.setTimeout(
        resolve,
        milliseconds,
      )
    },
  )
}

async function truncateFile(
  handle:
    FileSystemFileHandle,
): Promise<void> {
  const writable =
    await handle.createWritable()

  try {
    await writable.truncate(0)
  } finally {
    await writable.close()
  }
}

async function downloadAttempt(
  descriptor:
    PersistentModelDescriptor,
  handle:
    FileSystemFileHandle,
  attempt: number,
  listener?: (
    progress:
      PersistentModelProgress,
  ) => void,
): Promise<void> {
  let existingFile =
    await handle.getFile()

  if (
    existingFile.size >
    descriptor.encryptedBytes
  ) {
    await truncateFile(handle)
    existingFile =
      await handle.getFile()
  }

  let writeOffset =
    existingFile.size

  if (writeOffset > 0) {
    const existingMagic =
      await existingFile.slice(
        0,
        descriptor.magic.length,
      ).text()

    if (
      existingMagic !==
      descriptor.magic
    ) {
      await truncateFile(handle)
      writeOffset = 0
    }
  }

  const headers =
    new Headers({
      Accept:
        'application/octet-stream',
    })

  if (writeOffset > 0) {
    headers.set(
      'Range',
      `bytes=${writeOffset}-`,
    )
  }

  const controller =
    new AbortController()

  let inactivityTimer:
    number | null = null

  const armInactivityTimeout =
    () => {
      if (
        inactivityTimer !== null
      ) {
        window.clearTimeout(
          inactivityTimer,
        )
      }

      inactivityTimer =
        window.setTimeout(
          () => {
            controller.abort(
              new DOMException(
                'MODEL_DOWNLOAD_STALLED',
                'TimeoutError',
              ),
            )
          },
          inactivityTimeoutMs,
        )
    }

  armInactivityTimeout()

  let writable:
    FileSystemWritableFileStream |
    null = null

  try {
    const response =
      await fetch(
        descriptor.sourceUrl,
        {
          cache: 'no-store',
          headers,
          signal:
            controller.signal,
        },
      )

    if (
      !response.ok &&
      response.status !== 206
    ) {
      throw new Error(
        `دانلود ${descriptor.label} انجام نشد؛ کد ${response.status}.`,
      )
    }

    const resumed =
      writeOffset > 0 &&
      response.status === 206

    if (!resumed) {
      writeOffset = 0
    }

    writable =
      await handle.createWritable({
        keepExistingData:
          resumed,
      })

    if (!resumed) {
      await writable.truncate(0)
    }

    emit(
      descriptor,
      listener,
      'downloading',
      writeOffset,
      attempt,
      false,
      resumed
        ? `ادامه دانلود ${descriptor.label} از ${Math.round(writeOffset / 1024 / 1024).toLocaleString('fa-IR')} مگابایت...`
        : `در حال دانلود ${descriptor.label}...`,
    )

    if (!response.body) {
      const bytes =
        new Uint8Array(
          await response.arrayBuffer(),
        )

      await writable.write({
        type: 'write',
        position:
          writeOffset,
        data:
          copyArrayBuffer(bytes),
      })

      writeOffset +=
        bytes.byteLength

      emit(
        descriptor,
        listener,
        'downloading',
        writeOffset,
        attempt,
        false,
        `در حال ذخیره ${descriptor.label} روی حافظه داخلی...`,
      )
    } else {
      const reader =
        response.body.getReader()

      while (true) {
        const result =
          await reader.read()

        if (result.done) {
          break
        }

        const chunk =
          result.value

        if (!chunk) {
          continue
        }

        if (
          writeOffset +
            chunk.byteLength >
          descriptor.encryptedBytes
        ) {
          await reader.cancel()

          throw new Error(
            `حجم دانلود ${descriptor.label} از مقدار معتبر بیشتر شد.`,
          )
        }

        await writable.write({
          type: 'write',
          position:
            writeOffset,
          data:
            copyArrayBuffer(chunk),
        })

        writeOffset +=
          chunk.byteLength

        armInactivityTimeout()

        emit(
          descriptor,
          listener,
          'downloading',
          writeOffset,
          attempt,
          false,
          `دانلود و ذخیره ${descriptor.label}: ${Math.round(writeOffset / descriptor.encryptedBytes * 100).toLocaleString('fa-IR')}٪`,
        )
      }
    }

    await writable.close()
    writable = null

    if (
      writeOffset !==
      descriptor.encryptedBytes
    ) {
      throw new Error(
        `دانلود ${descriptor.label} ناقص بود؛ ${writeOffset} از ${descriptor.encryptedBytes} بایت ذخیره شد.`,
      )
    }
  } catch (error) {
    if (writable) {
      try {
        /*
         * Close commits the partial file.
         * The next retry resumes with Range.
         */
        await writable.close()
      } catch {
        // The next attempt validates the file.
      }
    }

    throw error
  } finally {
    if (
      inactivityTimer !== null
    ) {
      window.clearTimeout(
        inactivityTimer,
      )
    }
  }
}

async function prepareInternal(
  descriptor:
    PersistentModelDescriptor,
  listener?: (
    progress:
      PersistentModelProgress,
  ) => void,
): Promise<void> {
  if (!opfsIsAvailable()) {
    throw new Error(
      'مرورگر امکان ذخیره فایل مدل روی حافظه داخلی را ندارد؛ Samsung Internet یا Chrome را به آخرین نسخه به‌روزرسانی کنید.',
    )
  }

  await requestPersistence()

  emit(
    descriptor,
    listener,
    'checking',
    0,
    0,
    false,
    `در حال بررسی نسخه ذخیره‌شده ${descriptor.label}...`,
  )

  const existing =
    await readStoredFileInfo(
      descriptor,
    )

  if (existing.valid) {
    emit(
      descriptor,
      listener,
      'ready',
      descriptor.encryptedBytes,
      0,
      true,
      `${descriptor.label} از قبل روی حافظه داخلی آماده است.`,
    )

    return
  }

  const handle =
    existing.handle ??
    await modelFileHandle(
      descriptor,
      true,
    )

  if (!handle) {
    throw new Error(
      `فایل محلی ${descriptor.label} ایجاد نشد.`,
    )
  }

  let lastError:
    unknown = null

  for (
    let attempt = 1;
    attempt <= maximumAttempts;
    attempt += 1
  ) {
    try {
      if (attempt > 1) {
        const partial =
          await handle.getFile()

        emit(
          descriptor,
          listener,
          'retrying',
          partial.size,
          attempt,
          false,
          `ارتباط قطع شد؛ تلاش ${attempt.toLocaleString('fa-IR')} از ${maximumAttempts.toLocaleString('fa-IR')} و ادامه از محل قبلی...`,
        )

        await delay(
          1200 * attempt,
        )
      }

      await downloadAttempt(
        descriptor,
        handle,
        attempt,
        listener,
      )

      emit(
        descriptor,
        listener,
        'verifying',
        descriptor.encryptedBytes,
        attempt,
        false,
        `در حال بررسی فایل ذخیره‌شده ${descriptor.label}...`,
      )

      const stored =
        await readStoredFileInfo(
          descriptor,
        )

      if (!stored.valid) {
        throw new Error(
          `فایل ذخیره‌شده ${descriptor.label} معتبر نیست.`,
        )
      }

      emit(
        descriptor,
        listener,
        'ready',
        descriptor.encryptedBytes,
        attempt,
        false,
        `${descriptor.label} روی حافظه داخلی ذخیره شد.`,
      )

      return
    } catch (error: unknown) {
      lastError = error

      if (
        attempt ===
        maximumAttempts
      ) {
        break
      }
    }
  }

  const detail =
    lastError instanceof Error
      ? lastError.message
      : String(lastError)

  throw new Error(
    `دانلود پایدار ${descriptor.label} پس از ${maximumAttempts.toLocaleString('fa-IR')} تلاش انجام نشد: ${detail}`,
  )
}

export function ensurePersistentEncryptedModel(
  descriptor:
    PersistentModelDescriptor,
  listener?: (
    progress:
      PersistentModelProgress,
  ) => void,
): Promise<void> {
  const key =
    fileName(descriptor)

  const active =
    activePreparations.get(key)

  if (active) {
    return active
  }

  const promise =
    prepareInternal(
      descriptor,
      listener,
    ).finally(
      () => {
        activePreparations.delete(
          key,
        )
      },
    )

  activePreparations.set(
    key,
    promise,
  )

  return promise
}

export async function readPersistentEncryptedModel(
  descriptor:
    PersistentModelDescriptor,
  listener?: (
    progress:
      PersistentModelProgress,
  ) => void,
): Promise<Uint8Array> {
  await ensurePersistentEncryptedModel(
    descriptor,
    listener,
  )

  const stored =
    await readStoredFileInfo(
      descriptor,
    )

  if (
    !stored.valid ||
    !stored.file
  ) {
    throw new Error(
      `نسخه ذخیره‌شده ${descriptor.label} در دسترس نیست.`,
    )
  }

  emit(
    descriptor,
    listener,
    'checking',
    descriptor.encryptedBytes,
    0,
    true,
    `در حال خواندن ${descriptor.label} از حافظه داخلی...`,
  )

  const bytes =
    new Uint8Array(
      await stored.file.arrayBuffer(),
    )

  if (
    bytes.byteLength !==
    descriptor.encryptedBytes
  ) {
    bytes.fill(0)

    throw new Error(
      `حجم فایل محلی ${descriptor.label} معتبر نیست.`,
    )
  }

  return bytes
}
