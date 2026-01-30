export function shouldApplyRemoteCode (
  localCode: string,
  remoteCode: string | null | undefined,
): boolean {
  if (!remoteCode) return false
  if (remoteCode.trim() === '') return false
  return remoteCode !== localCode
}
