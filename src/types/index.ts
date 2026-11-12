export interface Contact {
  id: string;
  name: string;
  rut: string;
  bank: string;
  account: string;
  aliases: string[];
  initials: string;
  isFavorite?: boolean;
}

export type ViewType = 'home' | 'recipients' | 'transfer' | 'success' | 'receipt';

export type StepType =
  | 'home'
  | 'choose_type'
  | 'recipient'
  | 'confirm_recipient'
  | 'amount'
  | 'confirm_send'
  | 'auth'
  | 'done';

export type AssistantStatus = 'idle' | 'speaking' | 'listening' | 'thinking' | 'waiting';

export type FontSizeMode = 'normal' | 'large' | 'xlarge';

export type AppMode = 'copilot' | 'classic';

export type WidgetType =
  | 'none'
  | 'transfer_type'
  | 'recipient_picker'
  | 'new_account_form'
  | 'recipient_confirm'
  | 'amount_selector'
  | 'pre_auth_summary'
  | 'bepass_keypad'
  | 'receipt_card'
  | 'help_menu';

export interface TimelineMessage {
  id: string;
  sender: 'assistant' | 'user' | 'system';
  text: string;
  spokenText?: string;
  timestamp: string;
  widgetType?: WidgetType;
  widgetData?: any;
  isCompleted?: boolean;
}

export interface TransactionReceipt {
  amount: number;
  destName: string;
  destRut: string;
  destBank: string;
  destAccount: string;
  sourceAccount: string;
  date: string;
  opNumber: string;
}
