import "server-only";
import { getCDRClient, OWNER_WRITE_CONDITION, parseVaultUuid } from "@/lib/cdr";
import { getPlatformWallet } from "@/lib/wallet";
import { conditions, uuidToLabel } from "@piplabs/cdr-sdk";
import { toHex } from "viem";

export async function allocateVault(creatorAddress: string) {
  const cdrClient = await getCDRClient();
  const platformWallet = getPlatformWallet();

  const { conditionData: writeConditionData } = conditions.ownerOnly({
    address: OWNER_WRITE_CONDITION,
    owner: platformWallet.account.address,
  });

  const { uuid } = await cdrClient.uploader.allocate({
    updatable: true,
    writeConditionAddr: OWNER_WRITE_CONDITION as `0x${string}`,
    readConditionAddr: platformWallet.account.address as `0x${string}`,
    writeConditionData: writeConditionData as `0x${string}`,
    readConditionData: "0x",
    skipConditionValidation: true,
  });

  return uuid;
}

export async function encryptAndStoreResponse(
  formCreatorAddress: string,
  answers: Record<string, unknown>
) {
  const cdrClient = await getCDRClient();
  const platformWallet = getPlatformWallet();
  const globalPubKey = await cdrClient.observer.getGlobalPubKey();

  const payloadToEncrypt = JSON.stringify({
    answers,
    submittedAt: new Date().toISOString(),
  });

  const { conditionData: writeConditionData } = conditions.ownerOnly({
    address: OWNER_WRITE_CONDITION,
    owner: platformWallet.account.address,
  });

  const { uuid } = await cdrClient.uploader.allocate({
    updatable: false,
    writeConditionAddr: OWNER_WRITE_CONDITION as `0x${string}`,
    readConditionAddr: platformWallet.account.address as `0x${string}`,
    writeConditionData: writeConditionData as `0x${string}`,
    readConditionData: "0x",
    skipConditionValidation: true,
  });

  const ciphertext = await cdrClient.uploader.encryptDataKey({
    dataKey: new TextEncoder().encode(payloadToEncrypt),
    globalPubKey,
    label: uuidToLabel(uuid),
  });

  await cdrClient.uploader.write({
    uuid,
    accessAuxData: "0x",
    encryptedData: toHex(ciphertext.raw),
  });

  return uuid;
}

export async function decryptResponse(vaultUuidStr: string) {
  const cdrClient = await getCDRClient();
  const numericUuid = parseVaultUuid(vaultUuidStr);

  const { dataKey } = await cdrClient.consumer.accessCDR({
    uuid: numericUuid,
    accessAuxData: "0x",
    timeoutMs: 120_000,
  });

  if (dataKey) {
    const payloadStr = new TextDecoder().decode(dataKey);
    return JSON.parse(payloadStr);
  }

  return null;
}
