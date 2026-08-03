import {
  cpSync,
  existsSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import {
  resolve,
} from 'node:path'

const root = resolve(import.meta.dirname, '..')
const siteOut = resolve(root, 'apps/site/out')
const webOut = resolve(root, 'apps/web/dist')
const deploy = resolve(root, 'deploy')

for (const required of [siteOut, webOut]) {
  if (!existsSync(required)) {
    throw new Error(`BUILD_OUTPUT_MISSING=${required}`)
  }
}

rmSync(deploy, {recursive: true, force: true})
mkdirSync(deploy, {recursive: true})
cpSync(siteOut, deploy, {recursive: true})
cpSync(webOut, resolve(deploy, 'app'), {recursive: true})

writeFileSync(resolve(deploy, '.nojekyll'), '')
writeFileSync(resolve(deploy, 'CNAME'), 'beshmarai.ir\n')

const appIndex = resolve(deploy, 'app/index.html')
if (existsSync(appIndex)) {
  cpSync(appIndex, resolve(deploy, 'app/404.html'))
}

console.log('BESHMARAI_GITHUB_PAGES_ASSEMBLY=PASSED')
console.log(`DEPLOY_DIRECTORY=${deploy}`)
