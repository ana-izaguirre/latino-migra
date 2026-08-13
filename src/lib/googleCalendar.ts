/**
 * Helper to generate a 1-click Google Calendar Event Creation URL
 */
export interface GoogleCalendarEventOptions {
  title: string;
  details: string;
  location?: string;
  startDate?: string; // YYYY-MM-DD or YYYYMMDDTHHMMSSZ
  endDate?: string;
  allDay?: boolean;
}

export function generateGoogleCalendarUrl({
  title,
  details,
  location = "",
  startDate,
  endDate,
}: GoogleCalendarEventOptions): string {
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
