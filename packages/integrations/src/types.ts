export interface SendSmsResult {
  success: boolean;
  externalId?: string;
  error?: string;
}

export interface SendEmailResult {
  success: boolean;
  externalId?: string;
  error?: string;
}

export interface UploadResult {
  success: boolean;
  url?: string;
  key?: string;
  error?: string;
}
