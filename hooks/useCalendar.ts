"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useToday } from "@/hooks/useToday";
import {
  getDateKey,
  getDaysInMonth,
  getStartDayOfWeek,
  isSameDay,
} from "@/lib/date-utils";

export interface CalendarEvent {
  transaction_date?: string;
  created_at?: string;
  type?: string;
  amount?: number;
}

export function useCalendar(events: CalendarEvent[] = []) {
  const today = useToday();
  const [viewDate, setViewDate] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selectedDate, setSelectedDate] = useState<Date | null>(today);
  const userNavigatedRef = useRef(false);
  const previousTodayRef = useRef(today);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const startDay = getStartDayOfWeek(year, month);
  const totalCells = Math.ceil((startDay + daysInMonth) / 7) * 7;

  useEffect(() => {
    const previousToday = previousTodayRef.current;
    if (selectedDate && isSameDay(selectedDate, previousToday)) {
      setSelectedDate(today);
    }
    if (!userNavigatedRef.current) {
      setViewDate((current) =>
        current.getFullYear() === today.getFullYear() &&
        current.getMonth() === today.getMonth() &&
        current.getDate() === 1
          ? current
          : new Date(today.getFullYear(), today.getMonth(), 1)
      );
    }
    previousTodayRef.current = today;
  }, [today, selectedDate]);

  const eventsByDate = useMemo(() => {
    const index = new Map<string, CalendarEvent[]>();
    for (const event of events) {
      const key = getDateKey(event.transaction_date || event.created_at);
      if (!key) continue;
      const matchingEvents = index.get(key);
      if (matchingEvents) matchingEvents.push(event);
      else index.set(key, [event]);
    }
    return index;
  }, [events]);

  const grid = useMemo<(Date | null)[]>(() => {
    const dates: (Date | null)[] = [];
    for (let index = 0; index < totalCells; index++) {
      const day = index - startDay + 1;
      dates.push(day >= 1 && day <= daysInMonth ? new Date(year, month, day) : null);
    }
    return dates;
  }, [daysInMonth, month, startDay, totalCells, year]);

  const goToPreviousMonth = useCallback(() => {
    userNavigatedRef.current = true;
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() - 1, 1));
  }, []);

  const goToNextMonth = useCallback(() => {
    userNavigatedRef.current = true;
    setViewDate((current) => new Date(current.getFullYear(), current.getMonth() + 1, 1));
  }, []);

  const goToToday = useCallback(() => {
    userNavigatedRef.current = false;
    setViewDate(new Date(today.getFullYear(), today.getMonth(), 1));
    setSelectedDate(today);
  }, [today]);

  const selectDate = useCallback((date: Date) => {
    setSelectedDate(date);
  }, []);

  return {
    today,
    viewDate,
    selectedDate,
    year,
    month,
    daysInMonth,
    eventsByDate,
    grid,
    goToPreviousMonth,
    goToNextMonth,
    goToToday,
    selectDate,
  };
}
