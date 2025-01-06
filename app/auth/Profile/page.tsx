"use client";

import { SquiggleButton } from "@/components/squiggle-button";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import axios from "axios";
import { useRouter } from "next/navigation";
import { Switch } from "@/components/ui/switch";
import Cookies from "js-cookie";
import { supabase } from "@/utils/supabase/supabaseClient";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function ProfilePage() {
  const [formData, setFormData] = useState({
    gender: "",
    age: "",
    height: "",
    weight: "",
    activeDays: "",
    hasEquipment: false,
    goal: "",
    goalWeight: "",
    injuries: "",
    fitnessLevel: "",
    workoutSplit: "",
  });
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchSession();
  }, []);

  async function fetchSession() {
    try {
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) {
        console.error("Error fetching session:", sessionError);
        router.replace("/");
        return;
      }

      if (!sessionData.session) {
        router.replace("/");
        return;
      }

      const user = sessionData.session.user;
      setUserId(user.id);
      Cookies.set("uid", user.id, { expires: 7 });
      Cookies.set("uname", user.user_metadata?.name || "User", { expires: 7 });

      const { data: userWorkout, error: workoutError } = await supabase
        .from("users_workouts")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (userWorkout) {
        router.push("/auth/Dashboard");
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      router.replace("/");
    } finally {
      setLoading(false);
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: any) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (checked: boolean) => {
    setFormData((prev) => ({ ...prev, hasEquipment: checked }));
  };

  const generatePrompt = async () => {
    if (!userId) {
      setError("User session not found. Please log in again.");
      router.replace("/");
      return;
    }

    if (
      !formData.age ||
      !formData.gender ||
      !formData.height ||
      !formData.weight
    ) {
      setError("Please fill all required fields.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // First, save user fitness details
      const { error: insertError } = await supabase
        .from("user_fitness_details")
        .insert({
          user_id: userId,
          gender: formData.gender,
          age: formData.age,
          height: formData.height,
          weight: formData.weight,
          active_days: formData.activeDays,
          has_equipment: formData.hasEquipment,
          goal: formData.goal,
          goal_weight: formData.goalWeight,
          injuries: formData.injuries,
          fitness_level: formData.fitnessLevel,
          workout_split: formData.workoutSplit,
        });

      if (insertError) {
        throw new Error(`Error saving fitness details: ${insertError.message}`);
      }

      // Generate the prompt text
      const promptText = `You are a professional fitness coach. Your task is to generate a **precise, structured, and comprehensive 90-day workout plan** tailored to the user's profile below. 

### Instructions:
1. **Markdown Format Only**: Provide the entire workout plan in clear, professional, and well-organized markdown format. Do not include any text outside the markdown plan (like tips or advice).
2. **No Fluff**: Focus solely on the workout plan. Do not include motivational advice, extra tips, or explanations.
3. **Detailed Breakdown**:
    - Clearly specify the workout split (e.g., push-pull-legs, full body, upper/lower).
    - List exercises with sets, reps, and rest times for each day.
    - Adjust the difficulty based on the user's fitness level.
    - Periodize the plan over 90 days (e.g., progressive overload, rest weeks).
4. **Customization**: Ensure exercises are adapted based on available equipment and the user's goals.

### User Profile:
- **Age:** ${formData.age} years
- **Gender:** ${formData.gender}
- **Height:** ${formData.height} cm
- **Weight:** ${formData.weight} kg
- **Equipment Access:** ${formData.hasEquipment ? "Fully equipped gym" : "No gym equipment"}
- **Available Workout Days:** ${formData.activeDays} days per week
- **Goal:** ${formData.goal} (Target Weight: ${formData.goalWeight} kg)
- **Fitness Level:** ${formData.fitnessLevel}
${formData.injuries ? `- **Medical Conditions/Injuries:** ${formData.injuries}` : ""}
- **Preferred Workout Split:** ${formData.workoutSplit}

### Example Structure:
\`\`\`markdown
# 90-Day Workout Plan

## Phase 1: Weeks 1-4
### Day 1: [Workout Name]
- **Exercise 1**: [Sets x Reps, Rest]
- **Exercise 2**: [Sets x Reps, Rest]
...

## Phase 2: Weeks 5-8
...

## Phase 3: Weeks 9-12
...
\`\`\`

### Note:
1. Ensure the markdown output is clean and error-free.
2. Make the plan intuitive and beginner-friendly if applicable.
3. All exercises must align with the user’s fitness level and equipment availability.
4. Progression should be built into the plan.`;

      // Generate workout plan
      const response = await axios.post(
        "/api/generateWorkoutPlan",
        { prompt: promptText },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 60000, // 60 second timeout
        }
      );

      if (!response.data || !response.data.content) {
        throw new Error("Invalid response from workout plan generation");
      }

      // Save the workout plan
      const { error: workoutError } = await supabase
        .from("users_workouts")
        .insert({
          user_id: userId,
          workout_plan: response.data.content,
        });

      if (workoutError) {
        throw new Error(`Error saving workout plan: ${workoutError.message}`);
      }

      // Redirect to dashboard on success
      router.push("/auth/Dashboard");
    } catch (err) {
      console.error("Error in generatePrompt:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Error generating workout plan. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen">
      {loading ? (
        <div className="min-h-screen flex items-center justify-center">
          <motion.div
            className="text-2xl font-medium text-gray-900"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
          >
            {error ? "Error occurred" : "Processing your request..."}
          </motion.div>
        </div>
      ) : (
        <motion.div
          className="container mx-auto px-4 max-w-2xl py-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-4xl font-bold mb-8 text-center text-gradient">
            Create Your Profile
          </h1>
          <div className="glass-card p-8 rounded-2xl shadow-xl">
            <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-gray-800">
                    Gender
                  </Label>
                  <Select
                    name="gender"
                    onValueChange={(value) =>
                      handleSelectChange("gender", value)
                    }
                  >
                    <SelectTrigger className="bg-white/70 border-gray-300 rounded-full">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/90 rounded-lg">
                      <SelectItem value="male">Male</SelectItem>
                      <SelectItem value="female">Female</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="age" className="text-gray-800">
                    Age
                  </Label>
                  <Input
                    id="age"
                    name="age"
                    type="number"
                    className="bg-white/70 border-gray-300 rounded-full"
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="height" className="text-gray-800">
                    Height (cm)
                  </Label>
                  <Input
                    id="height"
                    name="height"
                    type="number"
                    className="bg-white/70 border-gray-300 rounded-full"
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight" className="text-gray-800">
                    Weight (kg)
                  </Label>
                  <Input
                    id="weight"
                    name="weight"
                    type="number"
                    className="bg-white/70 border-gray-300 rounded-full"
                    onChange={handleInputChange}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="activeDays" className="text-gray-800">
                  Active Days per Week
                </Label>
                <Select
                  name="activeDays"
                  onValueChange={(value) =>
                    handleSelectChange("activeDays", value)
                  }
                >
                  <SelectTrigger className="bg-white/70 border-gray-300 rounded-full">
                    <SelectValue placeholder="Select active days" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/90 rounded-lg">
                    {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                      <SelectItem key={day} value={day.toString()}>
                        {day}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="hasEquipment"
                  onCheckedChange={handleSwitchChange}
                  className="bg-purple-500  data-[state=checked]:bg-purple-300/20 border-2 border-purple-300/20"
                />
                <Label htmlFor="hasEquipment" className="text-gray-800">
                  I have access to gym equipment
                </Label>
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal" className="text-gray-800">
                  Fitness Goal
                </Label>
                <Select
                  name="goal"
                  onValueChange={(value) => handleSelectChange("goal", value)}
                >
                  <SelectTrigger className="bg-white/70 border-gray-300 rounded-full">
                    <SelectValue placeholder="Select your goal" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/90 rounded-lg">
                    <SelectItem value="weight_loss">Weight Loss</SelectItem>
                    <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                    <SelectItem value="strength">Strength</SelectItem>
                    <SelectItem value="endurance">Endurance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="goalWeight" className="text-gray-800">
                  Goal Weight (kg)
                </Label>
                <Input
                  id="goalWeight"
                  name="goalWeight"
                  className="bg-white/70 border-gray-300 rounded-full"
                  type="number"
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="injuries" className="text-gray-800">
                  Injuries or Medical Conditions (if any)
                </Label>
                <Input
                  id="injuries"
                  name="injuries"
                  className="bg-white/70 border-gray-300 rounded-full"
                  onChange={handleInputChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fitnessLevel" className="text-gray-800">
                  Fitness Level
                </Label>
                <Select
                  name="fitnessLevel"
                  onValueChange={(value) =>
                    handleSelectChange("fitnessLevel", value)
                  }
                >
                  <SelectTrigger className="bg-white/70 border-gray-300 rounded-full">
                    <SelectValue placeholder="Select your fitness level" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/90 rounded-lg">
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="workoutSplit" className="text-gray-800">
                  Preferred Workout Split
                </Label>
                <Select
                  name="workoutSplit"
                  onValueChange={(value) =>
                    handleSelectChange("workoutSplit", value)
                  }
                >
                  <SelectTrigger className="bg-white/70 border-gray-300 rounded-full">
                    <SelectValue placeholder="Select workout split" />
                  </SelectTrigger>
                  <SelectContent className="bg-white/90 rounded-lg">
                    <SelectItem value="full_body">Full Body</SelectItem>
                    <SelectItem value="upper_lower">Upper/Lower</SelectItem>
                    <SelectItem value="push_pull_legs">
                      Push/Pull/Legs
                    </SelectItem>
                    <SelectItem value="body_part">Body Part Split</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Link href="/auth/Dashboard">
                <SquiggleButton
                  onClick={generatePrompt}
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? "Generating..." : "Generate Workout Plan"}
                </SquiggleButton>
              </Link>

              {error && <div className="text-red-600 mt-4">{error}</div>}
            </form>
          </div>
        </motion.div>
      )}
    </div>
  );
}
