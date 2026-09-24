import { externalLinkPermissionRequest, hasPermissions } from "@/src/permissions/optional";

let permissionGranted: boolean | undefined;
let permissionCheck: Promise<boolean> | undefined;
let permissionRevision = 0;

export const getExternalLinkPermissionState = () => permissionGranted;

export const resolveExternalLinkPermissionState = () => {
  const revision = permissionRevision;
  permissionCheck ??= hasPermissions(externalLinkPermissionRequest).then(granted => {
    if (permissionRevision === revision) {
      permissionGranted = granted;
    }
    return permissionGranted ?? granted;
  });
  return permissionCheck;
};

export const updateExternalLinkPermissionState = (granted: boolean | undefined) => {
  permissionRevision++;
  permissionGranted = granted;
  permissionCheck = undefined;
};
