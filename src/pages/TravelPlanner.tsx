import { useEffect, useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Plane, Search, MapPin, Clock, DollarSign, Utensils, Camera, Sun, CloudRain, FileText, Star } from "lucide-react";
import { supabase, supabaseEnabled } from "@/lib/supabaseClient";
import { useSupabaseSession } from "@/hooks/useSupabaseSession";
import { subscribeToTable } from "@/lib/realtime";
import { createJob, getSignedUrl, listJobOutputs } from "@/lib/jobs";

type DayPlan = {
  day: number;
  title: string;
  activities: { time: string; activity: string; type: "attraction" | "food" | "transport" | "rest"; cost: string; tip: string }[];
  weather: string;
};

type TravelPlanRow = {
  id: string;
  destination: string;
  dates: string;
  budget: string;
  travelers: string;
  travel_style: string;
  pace: string;
  interests: string;
  itinerary: DayPlan[];
  budget_breakdown: { category: string; amount: string; pct: number }[];
  packing_list: string[];
};

const TravelPlanner = () => {
  const { session } = useSupabaseSession();
  const [hasPlanned, setHasPlanned] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expandedDay, setExpandedDay] = useState(1);
  const [plan, setPlan] = useState<TravelPlanRow | null>(null);
  const [destination, setDestination] = useState("");
  const [dates, setDates] = useState("");
  const [budget, setBudget] = useState("");
  const [travelers, setTravelers] = useState("1");
  const [travelStyle, setTravelStyle] = useState("balanced");
  const [pace, setPace] = useState("moderate");
  const [interests, setInterests] = useState("");
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobOutputs, setJobOutputs] = useState<{ id: string; type: string; url: string | null }[]>([]);

  const userId = session?.user?.id;

  const loadLatestPlan = async () => {
    if (!userId || !supabaseEnabled || !supabase) return;
    const { data } = await supabase
      .from("travel_plans")
      .select("id,destination,dates,budget,travelers,travel_style,pace,interests,itinerary,budget_breakdown,packing_list")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) {
      setPlan(data as TravelPlanRow);
      setHasPlanned(true);
    }
  };

  useEffect(() => {
    if (!userId || !supabaseEnabled || !supabase) return;
    loadLatestPlan();
    const unsub = subscribeToTable<TravelPlanRow>("travel_plans", (payload) => {
      if (payload.new?.user_id !== userId) return;
      loadLatestPlan();
    });
    return () => unsub();
  }, [userId]);

  const handlePlan = async () => {
    if (!userId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("travel_plans")
      .insert({
        user_id: userId,
        destination,
        dates,
        budget,
        travelers,
        travel_style: travelStyle,
        pace,
        interests,
        itinerary: [],
        budget_breakdown: [],
        packing_list: [],
      })
      .select("id,destination,dates,budget,travelers,travel_style,pace,interests,itinerary,budget_breakdown,packing_list")
      .single();

    if (!error && data) {
      setPlan(data as TravelPlanRow);
      setHasPlanned(true);
      await supabase.from("activity_log").insert({
        user_id: userId,
        type: "travel",
        title: `Itinerary generated for ${destination}`,
      });
      await supabase.from("usage_events").insert({
        user_id: userId,
        event_type: "travel",
        credits_used: 3,
      });
    }
    setLoading(false);
  };

  const handleGenerate = async () => {
    if (!userId) return;
    const { jobId: createdId } = await createJob("travel", {
      destination,
      dates,
      budget,
      travelers,
      travelStyle,
      pace,
      interests,
    });
    setJobId(createdId);
  };

  useEffect(() => {
    const loadOutputs = async () => {
      if (!jobId) return;
      const items = await listJobOutputs(jobId);
      const urls = await Promise.all(
        items.map(async (o) => ({ id: o.id, type: o.type, url: await getSignedUrl(o.storage_path) }))
      );
      setJobOutputs(urls);
    };
    loadOutputs();
  }, [jobId]);

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
              <Input className="rounded-xl h-10" value={destination} onChange={(e) => setDestination(e.target.value)} />
            </div>
            <div>
              <Label className="text-sm mb-2 block">Dates</Label>
              <Input type="text" className="rounded-xl h-10" value={dates} onChange={(e) => setDates(e.target.value)} />
            </div>
            <div>
              <Label className="text-sm mb-2 block">Budget</Label>
              <Input className="rounded-xl h-10" value={budget} onChange={(e) => setBudget(e.target.value)} />
            </div>
            <div>
              <Label className="text-sm mb-2 block">Travelers</Label>
              <Select value={travelers} onValueChange={setTravelers}>
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
              <Select value={travelStyle} onValueChange={setTravelStyle}>
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
              <Select value={pace} onValueChange={setPace}>
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
              <Input className="rounded-xl h-10" value={interests} onChange={(e) => setInterests(e.target.value)} />
            </div>
          </div>
          <Button onClick={handleGenerate} className="rounded-xl h-10">
            <Search className="mr-2 h-4 w-4" /> Generate itinerary
          </Button>
        </motion.div>

        {jobOutputs.length > 0 && (
          <div className="bg-card border rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              {jobOutputs.map((o) => (
                <a key={o.id} href={o.url ?? "#"} className="text-sm underline">
                  {o.type.toUpperCase()}
                </a>
              ))}
            </div>
          </div>
        )}

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

        {hasPlanned && !loading && plan && (
          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {plan.itinerary.map((day) => (
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
                  {plan.budget_breakdown.map((b) => (
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
                  <span>{budget}</span>
                </div>
              </div>

              <div className="bg-card border rounded-xl p-5">
                <h3 className="font-medium mb-3 flex items-center gap-2"><MapPin className="h-4 w-4" /> Packing Essentials</h3>
                <ul className="space-y-1.5 text-sm text-muted-foreground">
                  {plan.packing_list.map((i) => (
                    <li key={i} className="flex items-center gap-2"><div className="h-1 w-1 rounded-full bg-foreground/30" />{i}</li>
                  ))}
                </ul>
              </div>

              <Button variant="outline" className="w-full rounded-xl"><FileText className="mr-2 h-4 w-4" /> Export PDF</Button>
            </div>
          </div>
        )}

        {!hasPlanned && !loading && <div className="py-10" />}
      </div>
    </DashboardLayout>
  );
};

export default TravelPlanner;
