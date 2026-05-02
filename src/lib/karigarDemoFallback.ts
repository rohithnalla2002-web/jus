import type { KarigarBoard, KarigarJob } from "@/lib/api";

/**
 * Shown only when the API returns zero karigar jobs (e.g. empty DB before seed).
 * Matches server seed tone so UI demos cross-karat lines and multiple karigars.
 */
const DEMO: KarigarJob[] = [
  {
    id: 90001,
    title: "Men's Heavy Chain",
    karigar: "Ramesh Kumar",
    material: "100g 18K + 15g 22K",
    deadline: "Apr 10",
    priority: "high",
    customerName: "Amit Gupta",
    customerMobile: "+91 65432 10987",
    instructions: "Cross-karat issue",
    size: "24 inch",
    referenceImage: "",
    price: "₹6,12,000",
    columnKey: "assigned",
  },
  {
    id: 90002,
    title: "Antique Jhumkas",
    karigar: "Suresh Soni",
    material: "35g Gold 22K + 6g Gold 18K",
    deadline: "Mar 29",
    priority: "medium",
    customerName: "Priya Sharma",
    customerMobile: "+91 98765 43210",
    instructions: "Dual-tone antique",
    size: "Large",
    referenceImage: "",
    price: "₹2,68,000",
    columnKey: "inProgress",
  },
  {
    id: 90003,
    title: "Temple Necklace",
    karigar: "Ramesh Kumar",
    material: "85g Gold 22K",
    deadline: "Mar 20",
    priority: "low",
    customerName: "Sunita Reddy",
    customerMobile: "+91 54321 09876",
    instructions: "Lakshmi motif",
    size: "18 inch",
    referenceImage: "",
    price: "₹5,20,000",
    columnKey: "completed",
  },
  {
    id: 90004,
    title: "Silver Anklets",
    karigar: "Vijay Verma",
    material: "32g Silver 925",
    deadline: "Mar 18",
    priority: "low",
    customerName: "Kavita Nair",
    customerMobile: "+91 91234 56780",
    instructions: "Fine chain",
    size: "10 inch",
    referenceImage: "",
    price: "₹18,500",
    columnKey: "completed",
  },
  {
    id: 90005,
    title: "Baby Kada Pair",
    karigar: "Vijay Verma",
    material: "28g Gold 22K",
    deadline: "Apr 5",
    priority: "medium",
    customerName: "Meera Iyer",
    customerMobile: "+91 76543 21098",
    instructions: "Smooth inner",
    size: "2.2",
    referenceImage: "",
    price: "₹1,86,000",
    columnKey: "assigned",
  },
];

function partition(boardJobs: KarigarJob[]): KarigarBoard {
  const assigned: KarigarJob[] = [];
  const inProgress: KarigarJob[] = [];
  const completed: KarigarJob[] = [];
  for (const j of boardJobs) {
    const ck = j.columnKey ?? "assigned";
    if (ck === "inProgress") {
      inProgress.push(j);
    } else if (ck === "completed") {
      completed.push(j);
    } else {
      assigned.push(j);
    }
  }
  return { assigned, inProgress, completed };
}

export function getKarigarDemoFallback(): { board: KarigarBoard; jobs: KarigarJob[] } {
  const jobs = DEMO.map((j) => ({ ...j }));
  return { board: partition(jobs), jobs };
}
