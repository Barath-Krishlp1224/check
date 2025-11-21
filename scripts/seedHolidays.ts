// scripts/seedHolidays.ts
import dotenv from "dotenv";
dotenv.config();
import { connectToDatabase } from "../lib/mongoose";
import Holiday from "../models/Holiday";

const staticHolidays = [
  { month: 1, day: 1, name: "New Year's Day", description: "A national holiday to mark the beginning of the new year.", isRecurring: true },
  { month: 1, day: 15, name: "Pongal", description: "Harvest festival holiday (Pongal)", isRecurring: true },
  { month: 1, day: 26, name: "Republic Day", description: "Commemorates the adoption of the Constitution.", isRecurring: true },
  { month: 4, day: 14, name: "Ambedkar Jayanti", description: "Birth anniversary of Dr. B.R. Ambedkar", isRecurring: true },
  { month: 5, day: 1, name: "Labor's Day", description: "Celebrating workers.", isRecurring: true },
  { month: 8, day: 15, name: "Independence Day", description: "India's independence day.", isRecurring: true },
  { month: 10, day: 2, name: "Gandhi Jayanti", description: "Birth anniversary of Mahatma Gandhi", isRecurring: true },
  { month: 11, day: 1, name: "Pondicherry Liberation Day", description: "Regional holiday for Puducherry", isRecurring: true },
  { month: 12, day: 25, name: "Christmas", description: "Christmas day", isRecurring: true }
  // Add other holidays; for variable ones (Diwali, Ramadan) either set dateISO for this year's date or update them each year
];

async function seed() {
  await connectToDatabase();
  for (const h of staticHolidays) {
    const exists = await Holiday.findOne({ name: h.name, month: h.month, day: h.day });
    if (!exists) {
      await Holiday.create(h);
      console.log("Inserted", h.name);
    } else {
      console.log("Already exists", h.name);
    }
  }
  process.exit(0);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
