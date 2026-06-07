/**
 * バックアップサービス（ローカルファースト版）
 *
 * expo-file-system SDK 56 の新 API（File / Directory / Paths）を使用。
 * expo-sharing で JSON ファイルをエクスポート。
 */

import { File, Paths } from "expo-file-system";
import { shareAsync } from "expo-sharing";
import { exportAllData, importAllData, type BackupData } from "./repository";

const BACKUP_FILENAME = "selfmanage-backup.json";

/**
 * バックアップを作成してデバイス内に保存
 */
export async function createBackup(): Promise<string> {
  const data = await exportAllData();
  const json = JSON.stringify(data, null, 2);
  const file = new File(Paths.document, BACKUP_FILENAME);
  file.write(json);
  return file.uri;
}

/**
 * バックアップファイルを共有（AirDrop, メール等）
 */
export async function shareBackup(): Promise<void> {
  const uri = await createBackup();
  await shareAsync(uri, {
    mimeType: "application/json",
    dialogTitle: "SelfManage バックアップを共有",
    UTI: "public.json",
  });
}

/**
 * 指定パスのバックアップファイルから復元
 */
export async function restoreFromFile(fileUri?: string): Promise<void> {
  const file = fileUri
    ? new File(fileUri)
    : new File(Paths.document, BACKUP_FILENAME);

  if (!file.exists) {
    throw new Error("バックアップファイルが見つかりません");
  }

  const json = await file.text();
  const data: BackupData = JSON.parse(json);

  if (!data.version || !data.profile || !data.recurringTasks) {
    throw new Error("無効なバックアップファイルです");
  }

  await importAllData(data);
}

/**
 * バックアップの最終日時を取得
 */
export async function getLastBackupDate(): Promise<string | null> {
  const file = new File(Paths.document, BACKUP_FILENAME);
  if (!file.exists) return null;

  try {
    const json = await file.text();
    const data: BackupData = JSON.parse(json);
    return data.exportedAt ?? null;
  } catch {
    return null;
  }
}
