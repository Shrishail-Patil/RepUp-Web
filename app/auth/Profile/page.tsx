"use client";

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
import { AnimatedDumbbell } from "@/components/animated-dumbbell";
import { AnimatedPlate } from "@/components/animated-plate";
import { Switch } from "@/components/ui/switch";
import Cookies from "js-cookie";
import { supabase } from "@/utils/supabase/supabaseClient";

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
  const [workoutPlan, setWorkoutPlan] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    async function checkUser(uid: string) {
      try {
        const { data: user, error } = await supabase
          .from("users_workouts")
          .select("*")
          .eq("user_id", uid)
          .single();
  
        if (error && error.code !== "PGRST116") {
          console.error("Error in checkUser:", error);
          setLoading(false);
          return;
        }
  
        if (user) {
          router.push("/auth/Dashboard");
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error("Unexpected error in checkUser:", err);
        setLoading(false);
      }
    }
  
    async function fetchSession() {
      try {
        const { data: sessionData, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Error fetching session:", error);
          router.replace("/");
          return;
        }
  
        const session = sessionData?.session;
        if (session) {
          const user = session.user;
          Cookies.set("uid", user.id, { expires: 7 });
          Cookies.set("uname", user.user_metadata?.name || "User", { expires: 7 });
          await checkUser(user.id);
        } else {
          router.replace("/");
        }
      } catch (error) {
        console.error("Unexpected error fetching session:", error);
        router.replace("/");
      }
    }
  
    fetchSession();
  }, [router]);

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
    try {
      setLoading(true);
      setError(""); // Reset error message
      const promptText = `Generate a comprehensive, 90-day personalized workout plan tailored to the following profile:
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

### Requirements:
1. **Markdown Format:** Deliver the entire workout plan in a clean and professional markdown format for ease of understanding and readability.
2. **Research-Based Plan:** Base all exercise recommendations on the latest fitness and exercise science.
3. **Customization:** Adapt exercises to the user’s fitness level and available equipment.
4. **Detail-Oriented:** Specify workout splits, exercise names, sets, reps, and rest times.
5. **Clarity:** Ensure the plan is clean and easy to follow.

### Additional Notes:
- **Consistency:** Ensure steady progress with appropriate recovery.
- **Variety:** Include engaging exercises.
- **Periodization:** Structure the plan across 90 days for gradual progress.`;

      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData?.session?.user?.id;

      const { error: insertError } = await supabase.from("user_fitness_details").insert({
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
        throw new Error("Error saving fitness details.");
      }

      const response = await axios.post("/api/generateWorkoutPlan", { prompt: promptText });
      setWorkoutPlan(response.data.content);
      router.push("/auth/Dashboard");
    } catch (err) {
      setError("Error generating workout plan. Please try again.");
      console.error("Error in generatePrompt:", err);
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
            Logging you in 😊
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
              {/* Form Fields */}
              {/* ... */}
              <Button
                className="mt-4 w-full"
                onClick={generatePrompt}
                disabled={loading}
              >
                {loading ? "Generating..." : "Generate Workout Plan"}
              </Button>
              {error && <div className="text-red-600 mt-4">{error}</div>}
            </form>
          </div>
        </motion.div>
      )}
    </div>
  );
}