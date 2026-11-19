import React, { createContext, useCallback, useContext, useMemo, useRef } from 'react';
import type { BookingContact, BookingPassengerInput } from '../services/api';

export type BookingDraft = {
  key: string;
  passengers: BookingPassengerInput[];
  bookingContact: BookingContact;
  outboundCheckedBagCount: number;
  returnCheckedBagCount: number;
  multiCheckedBagCounts: number[];
  protectionEnabled: boolean;
  promotionCode: string;
};

type BookingDraftContextValue = {
  getDraft: (key: string) => BookingDraft | null;
  setDraft: (draft: BookingDraft | null) => void;
};

const BookingDraftContext = createContext<BookingDraftContextValue | null>(null);

export function BookingDraftProvider({ children }: { children: React.ReactNode }) {
  const draftRef = useRef<BookingDraft | null>(null);
  const getDraft = useCallback(
    (key: string) => draftRef.current?.key === key ? draftRef.current : null,
    [],
  );
  const setDraft = useCallback((draft: BookingDraft | null) => {
    draftRef.current = draft;
  }, []);
  const value = useMemo(() => ({ getDraft, setDraft }), [getDraft, setDraft]);

  return (
    <BookingDraftContext.Provider value={value}>
      {children}
    </BookingDraftContext.Provider>
  );
}

export function useBookingDraft() {
  const value = useContext(BookingDraftContext);
  if (!value) {
    throw new Error('useBookingDraft must be used within BookingDraftProvider.');
  }
  return value;
}
