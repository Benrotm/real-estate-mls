
import { Calendar, ExternalLink } from 'lucide-react';

interface PropertyEvent {
    id: string;
    title: string;
    start_time: string;
    end_time: string;
    event_type: string;
}

interface OpenHouseWidgetProps {
    events: PropertyEvent[];
    propertyTitle: string;
    propertyAddress: string;
}

function generateGoogleCalendarUrl(event: PropertyEvent, propertyTitle: string, propertyAddress: string): string {
    const startDate = new Date(event.start_time);
    const endDate = new Date(event.end_time);

    // Format dates for Google Calendar (YYYYMMDDTHHmmssZ)
    const formatDate = (date: Date) => date.toISOString().replace(/-|:|\.\d{3}/g, '').slice(0, -1) + 'Z';

    const params = new URLSearchParams({
        action: 'TEMPLATE',
        text: `${event.title} - ${propertyTitle}`,
        dates: `${formatDate(startDate)}/${formatDate(endDate)}`,
        details: `Property viewing: ${propertyTitle}`,
        location: propertyAddress,
        sf: 'true',
        output: 'xml'
    });

    return `https://www.google.com/calendar/render?${params.toString()}`;
}

export default function OpenHouseWidget({ events, propertyTitle, propertyAddress }: OpenHouseWidgetProps) {
    if (!events || events.length === 0) return null;

    // Filter for future events
    const upcomingEvents = events.filter(e => new Date(e.start_time) >= new Date());

    if (upcomingEvents.length === 0) return null;

    return (
        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
                <div className="p-2 bg-indigo-100 rounded-lg">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                </div>
                <h3 className="text-lg font-bold text-indigo-900">Open House Events</h3>
            </div>

            <div className="space-y-3">
                {upcomingEvents.slice(0, 3).map(event => (
                    <div key={event.id} className="bg-white/80 backdrop-blur border border-indigo-100 rounded-lg p-4">
                        <div className="font-bold text-slate-800">{event.title}</div>
                        <div className="text-sm text-slate-600 mt-1">
                            📅 {new Date(event.start_time).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric'
                            })}
                        </div>
                        <div className="text-sm text-slate-500">
                            🕒 {new Date(event.start_time).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit'
                            })} - {new Date(event.end_time).toLocaleTimeString('en-US', {
                                hour: 'numeric',
                                minute: '2-digit'
                            })}
                        </div>
                        <a
                            href={generateGoogleCalendarUrl(event, propertyTitle, propertyAddress)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 flex items-center justify-center gap-2 w-full bg-indigo-600 text-white text-sm font-bold py-2.5 rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Add to Google Calendar
                        </a>
                    </div>
                ))}
            </div>
        </div>
    );
}
