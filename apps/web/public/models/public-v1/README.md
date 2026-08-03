# Public model package

The model binaries are intentionally not included in the Stage 2 source archive.

Run the supplied PowerShell Stage 2 preparation script. It verifies the exact
raw model SHA-256 values, splits the final model into GitHub-friendly parts, and
creates `manifest.json` in this directory.

Expected plaintext contracts:

- Preview: 2,674,908 bytes — `283AFE028C6977C16CF2AF26332D022C896038EEF5A2947B4D3E1A4F46390662`
- Final 1152 FP32: 80,805,153 bytes — `6EB79C2CA51B74A50EF6E9F7AC1413CB50405BB4E9AFDE6502D2239E4B8CE121`
