export interface FeedbackContext {
  currentScreen: string;
  habitState: string;
  repsCount: number;
  lastCheckInDate: string | null;
  recentCheckIns: Array<{
    date: string;
    actionTaken: boolean;
    triggerOccurred: boolean;
  }>;
  timestamp: string;
  userAgent: string;
}
