import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const eventsMock = [
  { id: 1, name: 'Event 1', date: '2024-01-01', location: 'Location 1', status: 'Upcoming' },
  { id: 2, name: 'Event 2', date: '2024-02-01', location: 'Location 2', status: 'Past' },
  // Add more mock events as needed
];

const EventsPage = () => {
  return (
    <div className="min-h-screen bg-gray-100">
      {/* NavBar goes here */}
      <div className="p-8">
        <div className="mb-4">
          <Button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
            Create Event
          </Button>
        </div>
        <div>
          {eventsMock.map((event) => (
            <Card key={event.id} className="mb-4 bg-white shadow-md rounded p-4">
              <h2 className="text-xl font-bold">{event.name}</h2>
              <p>Date: {event.date}</p>
              <p>Location: {event.location}</p>
              <p>Status: {event.status}</p>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EventsPage;
