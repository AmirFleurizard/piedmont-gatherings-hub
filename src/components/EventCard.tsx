import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin } from "lucide-react";

interface EventCardProps {
  title: string;
  date: string;
  location: string;
  description: string;
  imageUrl?: string;
}

const EventCard = ({ title, date, location, description, imageUrl }: EventCardProps) => {
  return (
    <Card className="overflow-hidden hover:shadow-lg transition-shadow">
      {imageUrl && (
        <div className="h-48 overflow-hidden">
          <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
        </div>
      )}
      <CardHeader>
        <CardTitle className="text-xl">{title}</CardTitle>
        <CardDescription className="flex flex-col gap-1 mt-2">
          <span className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            {date}
          </span>
          <span className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            {location}
          </span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-muted-foreground">{description}</p>
      </CardContent>
      <CardFooter>
        <Button variant="secondary" className="w-full">Register Now</Button>
      </CardFooter>
    </Card>
  );
};

export default EventCard;
