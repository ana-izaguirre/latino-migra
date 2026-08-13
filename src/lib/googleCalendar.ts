/**
 * Helper to generate 1-click Calendar Event Links & .ics files
 * Compatible with Google Calendar, Outlook Web, Apple Calendar / iCal
 */
export interface CalendarEventOptions {
  title: string;
  details: string;
  location?: string;
  startDate?: string; // YYYY-MM-DD or ISO string
  endDate?: string;
  allDay?: boolean;
}

export function generateGoogleCalendarUrl({
  title,
  details,
  location = "",
  startDate,
  endDate,
}: CalendarEventOptions): string {
  const baseUrl = "https://calendar.google.com/calendar/render";
  const params = new URLSearchParams();

  params.append("action", "TEMPLATE");
  params.append("text", `[LatinoMigra] ${title}`);
  params.append("details", details);
  if (location) params.append("location", location);

  // Format date or default to 30 days from now at 09:00 UTC
  let startFormatted = "";
  let endFormatted = "";

  if (startDate && startDate.includes("-")) {
    // Standard YYYY-MM-DD
    const cleanDate = startDate.replace(/-/g, "");
    startFormatted = `${cleanDate}T090000Z`;
    endFormatted = `${cleanDate}T100000Z`;
  } else if (startDate) {
    startFormatted = startDate;
    endFormatted = endDate || startDate;
  } else {
    // Default to 1 month from now
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    const iso = futureDate.toISOString().replace(/-|:|\.\d\d\d/g, "");
    startFormatted = iso.slice(0, 15) + "Z";
    endFormatted = iso.slice(0, 15) + "Z";
  }

  params.append("dates", `${startFormatted}/${endFormatted}`);

  return `${baseUrl}?${params.toString()}`;
}

export function generateOutlookCalendarUrl({
  title,
  details,
  location = "",
  startDate,
}: CalendarEventOptions): string {
  const baseUrl = "https://outlook.live.com/calendar/0/deeplink/compose";
  const params = new URLSearchParams();

  params.append("path", "/calendar/action/compose");
  params.append("rru", "addevent");
  params.append("subject", `[LatinoMigra] ${title}`);
  params.append("body", details);
  if (location) params.append("location", location);

  const start = startDate ? new Date(startDate) : new Date(Date.now() + 30 * 86400000);
  const end = new Date(start.getTime() + 3600000);

  params.append("startdt", start.toISOString());
  params.append("enddt", end.toISOString());

  return `${baseUrl}?${params.toString()}`;
}

export function downloadIcsFile({
  title,
  details,
  location = "",
  startDate,
}: CalendarEventOptions): void {
  const start = startDate ? new Date(startDate) : new Date(Date.now() + 30 * 86400000);
  const end = new Date(start.getTime() + 3600000);

  const formatDate = (date: Date) => {
    return date.toISOString().replace(/-|:|\.\d+/g, "");
  };

  const icsContent = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//LatinoMigra//ES",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `SUMMARY:[LatinoMigra] ${title.replace(/\n/g, " ")}`,
    `DESCRIPTION:${details.replace(/\n/g, "\\n")}`,
    location ? `LOCATION:${location.replace(/\n/g, " ")}` : "",
    `DTSTART:${formatDate(start)}`,
    `DTEND:${formatDate(end)}`,
    `DTSTAMP:${formatDate(new Date())}`,
    `UID:latinomigra-${Date.now()}@latinomigra.org`,
    "STATUS:CONFIRMED",
    "BEGIN:VALARM",
    "TRIGGER:-P1D",
    "DESCRIPTION:Recordatorio LatinoMigra",
    "ACTION:DISPLAY",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
  ]
    .filter(Boolean)
    .join("\r\n");

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${title.toLowerCase().replace(/[^a-z0-9]/g, "-")}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
