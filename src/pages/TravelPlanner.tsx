import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plane, Search, MapPin, Clock, DollarSign, Utensils, Camera, Sun, CloudRain, FileText, Star } from "lucide-react";

type DayPlan = {
  day: number;
  title: string;
  activities: { time: string; activity: string; type: "attraction" | "food" | "transport" | "rest"; cost: string; tip: string }[];
  weather: string;
};

const mockItinerary: DayPlan[] = [
  {
    day: 1, title: "Arrival & Shibuya Exploration", weather: "Partly Cloudy, 22°C",
    activities: [
      { time: "10:00", activity: "Arrive at Narita, take Skyliner to Ueno", type: "transport", cost: "$25", tip: "Buy Suica card at the airport" },
      { time: "13:00", activity: "Lunch at Ichiran Ramen, Shibuya", type: "food", cost: "$12", tip: "Go before noon to avoid queues" },
      { time: "14:30", activity: "Shibuya Crossing & Hachiko Statue", type: "attraction", cost: "Free", tip: "Best view from Shibuya Sky or Starbucks above" },
      { time: "16:00", activity: "Meiji Shrine & Harajuku", type: "attraction", cost: "Free", tip: "Walk through Takeshita Street after" },
      { time: "19:00", activity: "Dinner at Gonpachi (Kill Bill restaurant)", type: "food", cost: "$35", tip: "Reserve ahead. Hidden gem for atmosphere." },
    ],
  },
  {
    day: 2, title: "Asakusa, Akihabara & Ueno", weather: "Sunny, 24°C",
    activities: [
      { time: "08:00", activity: "Senso-ji Temple & Nakamise Street", type: "attraction", cost: "Free", tip: "Arrive early for fewer crowds" },
      { time: "11:00", activity: "Tokyo Skytree observation deck", type: "attraction", cost: "$20", tip: "Book online for fast-track entry" },
      { time: "13:00", activity: "Lunch at a local soba shop in Asakusa", type: "food", cost: "$10", tip: "Try tempura soba" },
      { time: "15:00", activity: "Akihabara electronics & anime district", type: "attraction", cost: "Varies", tip: "Visit Super Potato for retro games" },
      { time: "19:00", activity: "Dinner at izakaya in Ueno", type: "food", cost: "$25", tip: "Look for lantern-lit alleys" },
    ],
  },
  {
    day: 3, title: "Tsukiji, Ginza & Odaiba", weather: "Sunny, 26°C",
    activities: [
      { time: "07:00", activity: "Tsukiji Outer Market breakfast", type: "food", cost: "$15", tip: "Get fresh sashimi and tamagoyaki" },
      { time: "10:00", activity: "teamLab Borderless (Odaiba)", type: "attraction", cost: "$30", tip: "Wear white clothing for best photo effects" },
      { time: "13:00", activity: "Lunch at Decks Tokyo Beach", type: "food", cost: "$18", tip: "Try the takoyaki museum" },
      { time: "15:00", activity: "Ginza shopping district", type: "attraction", cost: "Free", tip: "Visit Uniqlo flagship on weekdays" },
      { time: "19:00", activity: "Dinner in Roppongi", type: "food", cost: "$40", tip: "Roppongi Hills has great sunset views" },
    ],
  },
];

const budgetBreakdown = [
  { category: "Flights", amount: "$850", pct: 40 },
  { category: "Accommodation", amount: "$600", pct: 28 },
  { category: "Food", amount: "$350", pct: 16 },
  { category: "Activities", amount: "$200", pct: 9 },
  { category: "Transport", amount: "$150", pct: 7 },
];

const TravelPlanner = () => {
  const [hasPlanned, setHasPlanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedDay, setExpandedDay] = useState(1);

  const handlePlan = () => {
    setLoading(true);
    setTimeout(() => { setLoading(false); setHasPlanned(true); }, 2000);
  };

  const typeIcons = { attraction: Camera, food: Utensils, transport: Plane, rest: Sun };

  return (
    <DashboardLayout>
      <div className="max-w-6xl">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold mb-1">AI Travel Planner</h1>
          <p className="text-muted-foreground mb-8">Generate complete itineraries with AI-curated hidden gems.</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border rounded-xl p-6 mb-6">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <Label className="text-sm mb-2 block">Destination</Label>
              <Input placeholder="e.g. Tokyo, Japan" className="rounded-xl h-10" defaultValue="Tokyo, Japan" />
            </div>
            <div>
              <Label className="text-sm mb-2 block">Dates</Label>
              <Input type="text" placeholder="Jul 15 – Jul 22" className="rounded-xl h-10" defaultValue="Jul 15 – Jul 22" />
            </div>
            <div>
              <Label className="text-sm mb-2 block">Budget</Label>
              <Input placeholder="e.g. $2,500" className="rounded-xl h-10" defaultValue="$2,500" />
            </div>
            <div>
              <Label className="text-sm mb-2 block">Travelers</Label>
              <Select defaultValue="2">
                <SelectTrigger className="rounded-xl h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 person</SelectItem>
                  <SelectItem value="2">2 people</SelectItem>
                  <SelectItem value="3">3 people</SelectItem>
                  <SelectItem value="4">4+ people</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm mb-2 block">Travel Style</Label>
              <Select defaultValue="balanced">
                <SelectTrigger className="rounded-xl h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="budget">Budget</SelectItem>
                  <SelectItem value="balanced">Balanced</SelectItem>
                  <SelectItem value="luxury">Luxury</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-sm mb-2 block">Pace</Label>
              <Select defaultValue="moderate">
                <SelectTrigger className="rounded-xl h-10"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="relaxed">Relaxed</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="packed">Packed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              <Label className="text-sm mb-2 block">Interests</Label>
              <Input placeholder="e.g. food, culture, nightlife, nature" className="rounded-xl h-10" defaultValue="food, culture, technology, photography" />
            </div>
          </div>
          <Button onClick={handlePlan} className="rounded-xl h-10">
            <Search className="mr-2 h-4 w-4" /> Generate itinerary
          </Button>
        </motion.div>

        {loading && (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card border rounded-xl p-6 space-y-3">
                <Skeleton className="h-5 w-48" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
          </div>
        )}

        {hasPlanned && !loading && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {mockItinerary.map((day) => (
                <motion.div
                  key={day.day}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card border rounded-xl overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedDay(expandedDay === day.day ? 0 : day.day)}
                    className="w-full flex items-center justify-between p-5 text-left"
                  >
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-sm font-bold">{day.day}</div>
                      <div>
                        <h3 className="font-medium">{day.title}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          {day.weather.includes("Sunny") ? <Sun className="h-3 w-3 text-warning" /> : <CloudRain className="h-3 w-3 text-muted-foreground" />}
                          <span className="text-xs text-muted-foreground">{day.weather}</span>
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" className="rounded-md">{day.activities.length} activities</Badge>
                  </button>

                  {expandedDay === day.day && (
                    <div className="px-5 pb-5 space-y-3 border-t pt-4">
                      {day.activities.map((a, i) => {
                        const Icon = typeIcons[a.type];
                        return (
                          <div key={i} className="flex gap-4 p-3 rounded-lg bg-muted/30">
                            <div className="flex flex-col items-center gap-1">
                              <span className="text-xs font-medium text-muted-foreground">{a.time}</span>
                              <Icon className="h-4 w-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{a.activity}</p>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-xs text-muted-foreground flex items-center gap-1"><DollarSign className="h-3 w-3" />{a.cost}</span>
                                <span className="text-xs text-muted-foreground flex items-center gap-1"><Star className="h-3 w-3" />{a.tip}</span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <div className="bg-card border rounded-xl p-5">
                <h3 className="font-medium mb-4 flex items-center gap-2"><DollarSign className="h-4 w-4" /> Budget Breakdown</h3>
                <div className="space-y-3">
                  {budgetBreakdown.map((b) => (
                    <div key={b.category}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{b.category}</span>
                        <span className="font-medium">{b.amount}</span>
                      </div>
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-foreground/20 rounded-full" style={{ width: `${b.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-4 pt-4 border-t text-sm font-medium">
                  <span>Total</span>
                  <span>$2,150</span>
                </div>
              </div>

              <div className="bg-card border rounded-xl p-5">
                <h3 className="font-medium mb-3 flex items-center gap-2"><MapPin className="h-4 w-4" /> Packing Essentials</h3>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {["Comfortable walking shoes", "Portable Wi-Fi / SIM card", "Power adapter (Type A/B)", "Light rain jacket", "Cash (many places cash-only)", "Suica/Pasmo transit card"].map((i) => (
                    <li key={i} className="flex items-center gap-2"><div className="h-1 w-1 rounded-full bg-foreground/30" />{i}</li>
                  ))}
                </ul>
              </div>

              <Button variant="outline" className="w-full rounded-xl"><FileText className="mr-2 h-4 w-4" /> Export PDF</Button>
            </div>
          </div>
        )}

        {!hasPlanned && !loading && (
          <div className="text-center py-20 text-muted-foreground">
            <Plane className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-medium mb-1">No trips planned yet</p>
            <p className="text-sm">Enter your destination and preferences to generate an itinerary.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default TravelPlanner;
