/** Initial rows - rupees are integer INR amounts (same as frontend parseCurrency). */

export const inventorySeed = [
  { name: "Royal Gold Necklace", category: "Gold", weight: "45.2g", purity: "22K (916)", priceRupees: 327200, hallmark: true, hallmarkNumber: "HC-1029", size: "45cm", providerName: "GoldMind ERP Suppliers", storageBoxNumber: "SB-07", image: "necklace", stock: 5, highSelling: true },
  { name: "Diamond Solitaire Ring", category: "Diamond", weight: "8.5g", purity: "18K (750)", priceRupees: 185000, hallmark: true, hallmarkNumber: "HC-1440", size: "Ring Size 8", providerName: "DiamondWorks Imports", storageBoxNumber: "SB-12", image: "ring", stock: 12, highSelling: true },
  { name: "Bridal Choker Set", category: "Bridal", weight: "120g", purity: "22K (916)", priceRupees: 869600, hallmark: true, hallmarkNumber: "HC-1763", size: "Premium Choker", providerName: "BridalGold Co.", storageBoxNumber: "SB-03", image: "choker", stock: 3, highSelling: false },
  { name: "Silver Anklet Pair", category: "Silver", weight: "32g", purity: "925 Sterling", priceRupees: 4800, hallmark: true, hallmarkNumber: "HC-0901", size: "9 Inch", providerName: "SilverLine Distributors", storageBoxNumber: "SB-22", image: "anklet", stock: 25, highSelling: false },
  { name: "Gold Bangles (Set of 4)", category: "Gold", weight: "62g", purity: "22K (916)", priceRupees: 449300, hallmark: true, hallmarkNumber: "HC-2112", size: "Bangles Set (4)", providerName: "GoldMind ERP Suppliers", storageBoxNumber: "SB-14", image: "bangles", stock: 8, highSelling: true },
  { name: "Pearl Earrings", category: "Gold", weight: "12g", purity: "18K (750)", priceRupees: 98400, hallmark: true, hallmarkNumber: "HC-1337", size: "Small Drop", providerName: "Pearl & Co.", storageBoxNumber: "SB-19", image: "earrings", stock: 15, highSelling: false },
  { name: "Platinum Wedding Band", category: "Platinum", weight: "6.8g", purity: "950 Pt", priceRupees: 62000, hallmark: true, hallmarkNumber: "HC-3050", size: "Ring Size 6.5", providerName: "Platinum Prime", storageBoxNumber: "SB-05", image: "band", stock: 20, highSelling: false },
  { name: "Temple Jewellery Set", category: "Bridal", weight: "85g", purity: "22K (916)", priceRupees: 615800, hallmark: true, hallmarkNumber: "HC-1984", size: "Temple Set (Full)", providerName: "BridalGold Co.", storageBoxNumber: "SB-01", image: "temple", stock: 4, highSelling: true },
];

export const customerSeed = [
  { name: "Priya Sharma", phone: "+91 98765 43210", email: "priya@email.com", address: "123 Luxury Lane, Jubilee Hills, Hyderabad, 500033", totalPurchasesRupees: 1245000, visits: 8, lastVisit: "2 days ago" },
  { name: "Rajesh Patel", phone: "+91 87654 32109", email: "rajesh@email.com", address: "45 Heritage Street, Banjara Hills, Hyderabad, 500034", totalPurchasesRupees: 2890000, visits: 15, lastVisit: "1 week ago" },
  { name: "Meera Iyer", phone: "+91 76543 21098", email: "meera@email.com", address: "88 Lake View Road, Gachibowli, Hyderabad, 500032", totalPurchasesRupees: 560000, visits: 4, lastVisit: "3 days ago" },
  { name: "Amit Gupta", phone: "+91 65432 10987", email: "amit@email.com", address: "9 Park Avenue, Secunderabad, Hyderabad, 500003", totalPurchasesRupees: 1830000, visits: 11, lastVisit: "Today" },
  { name: "Sunita Reddy", phone: "+91 54321 09876", email: "sunita@email.com", address: "67 Hillside Residency, Kondapur, 500084", totalPurchasesRupees: 975000, visits: 6, lastVisit: "5 days ago" },
];

export const employeeSeed = [
  { name: "Anita Desai", role: "Admin", department: "Management", salaryRupees: 85000, status: "active", joinDate: "Jan 2020", phone: "+91 98450 12001", email: "anita.desai@goldminderp.in", address: "22 Residency Road, Hyderabad, 500082" },
  { name: "Vikram Singh", role: "Salesman", department: "Retail", salaryRupees: 45000, status: "active", joinDate: "Mar 2021", phone: "+91 98450 12002", email: "vikram.singh@goldminderp.in", address: "14 Market Street, Secunderabad, 500003" },
  { name: "Pooja Mehta", role: "Salesman", department: "Retail", salaryRupees: 42000, status: "active", joinDate: "Jun 2021", phone: "+91 98450 12003", email: "pooja.mehta@goldminderp.in", address: "9 Green Park, Banjara Hills, 500034" },
  { name: "Rahul Sharma", role: "Karigar", department: "Inventory", salaryRupees: 35000, status: "active", joinDate: "Sep 2022", phone: "+91 98450 12004", email: "rahul.sharma@goldminderp.in", address: "31 Warehouse Lane, Kukatpally, 500072" },
  { name: "Kavita Nair", role: "Karigar", department: "Accounts", salaryRupees: 40000, status: "on-leave", joinDate: "Feb 2023", phone: "+91 98450 12005", email: "kavita.nair@goldminderp.in", address: "44 Finance Colony, Kondapur, 500084" },
  { name: "Ramesh Kumar", role: "Karigar", department: "Workshop", salaryRupees: 52000, status: "active", joinDate: "Apr 2019", phone: "+91 98450 12006", email: "ramesh.kumar@goldminderp.in", address: "Workshop Block A, Kukatpally, 500072" },
  { name: "Suresh Soni", role: "Karigar", department: "Workshop", salaryRupees: 48000, status: "active", joinDate: "Jul 2020", phone: "+91 98450 12007", email: "suresh.soni@goldminderp.in", address: "Artisan Lane, Secunderabad, 500003" },
  { name: "Deepak Jain", role: "Karigar", department: "Workshop", salaryRupees: 55000, status: "active", joinDate: "Jan 2018", phone: "+91 98450 12008", email: "deepak.jain@goldminderp.in", address: "Bridal Unit, Banjara Hills, 500034" },
  { name: "Vijay Verma", role: "Karigar", department: "Workshop", salaryRupees: 46000, status: "active", joinDate: "Nov 2021", phone: "+91 98450 12009", email: "vijay.verma@goldminderp.in", address: "Casting Bay, Gachibowli, 500032" },
];

/** daysAgo from seed moment */
export const orderSeed = [
  { id: "JW-2878", customer: "Priya Sharma", items: "Gold Necklace, Earrings", totalRupees: 425600, status: "ordered", daysAgo: 0 },
  { id: "JW-2877", customer: "Amit Gupta", items: "Diamond Ring", totalRupees: 185000, status: "in-production", daysAgo: 2 },
  { id: "JW-2876", customer: "Meera Iyer", items: "Bridal Set", totalRupees: 869600, status: "ready", daysAgo: 4 },
  { id: "JW-2875", customer: "Rajesh Patel", items: "Gold Bangles", totalRupees: 449300, status: "delivered", daysAgo: 6 },
  { id: "JW-2874", customer: "Sunita Reddy", items: "Platinum Chain", totalRupees: 210450, status: "ordered", daysAgo: 8 },
  { id: "JW-2873", customer: "Aarav Mehta", items: "Gold Ring", totalRupees: 105800, status: "ready", daysAgo: 10 },
  { id: "JW-2872", customer: "Nisha Verma", items: "Silver Anklet, Toe Rings", totalRupees: 28500, status: "in-production", daysAgo: 14 },
  { id: "JW-2871", customer: "Karan Kapoor", items: "Diamond Studs", totalRupees: 265000, status: "ordered", daysAgo: 16 },
  { id: "JW-2870", customer: "Divya Nair", items: "Pearl Earrings", totalRupees: 98400, status: "in-production", daysAgo: 18 },
  { id: "JW-2869", customer: "Rohit Kulkarni", items: "Gold Bangles, Bracelet", totalRupees: 340900, status: "ready", daysAgo: 22 },
  { id: "JW-2868", customer: "Vikram Singh", items: "Bridal Choker", totalRupees: 620300, status: "ordered", daysAgo: 25 },
  { id: "JW-2867", customer: "Anita Desai", items: "Platinum Wedding Band", totalRupees: 155000, status: "delivered", daysAgo: 28 },
  { id: "JW-2866", customer: "Suresh Patel", items: "Gold Necklace", totalRupees: 410250, status: "in-production", daysAgo: 35 },
  { id: "JW-2865", customer: "Neha Sharma", items: "Diamond Ring", totalRupees: 205700, status: "ready", daysAgo: 40 },
  { id: "JW-2864", customer: "Ramesh Kumar", items: "Bridal Set", totalRupees: 912000, status: "ordered", daysAgo: 45 },
  { id: "JW-2863", customer: "Sanjay Jain", items: "Gold Bangles", totalRupees: 388500, status: "ready", daysAgo: 50 },
  { id: "JW-2862", customer: "Priya Sharma", items: "Temple Jewellery", totalRupees: 615800, status: "in-production", daysAgo: 55 },
  { id: "JW-2861", customer: "Meera Iyer", items: "Platinum Chain", totalRupees: 240000, status: "delivered", daysAgo: 60 },
  { id: "JW-2839", customer: "Rajesh Patel", items: "Gold Necklace, Earrings", totalRupees: 480000, status: "ready", daysAgo: 220 },
  { id: "JW-2827", customer: "Amit Gupta", items: "Diamond Studs", totalRupees: 310000, status: "delivered", daysAgo: 320 },
];

export const karigarJobSeed = [
  { column: "assigned", title: "Gold Necklace - Custom", karigar: "Ramesh Kumar", material: "45g Gold 22K", deadline: "Mar 28", priority: "high", customerName: "Priya Sharma", customerMobile: "+91 98765 43210", instructions: "Temple finish with filigree work", size: "16 inch", referenceImage: "", priceRupees: 285000 },
  { column: "assigned", title: "Diamond Earrings Pair", karigar: "Suresh Soni", material: "12g Gold 18K + 2ct Diamond", deadline: "Apr 2", priority: "medium", customerName: "Rajesh Patel", customerMobile: "+91 87654 32109", instructions: "Matching bridal set design", size: "Medium", referenceImage: "", priceRupees: 412000 },
  { column: "assigned", title: "Men's Heavy Chain", karigar: "Ramesh Kumar", material: "100g 18K + 15g 22K", deadline: "Apr 10", priority: "high", customerName: "Amit Gupta", customerMobile: "+91 65432 10987", instructions: "Cross-karat issue — reconcile in fine gold", size: "24 inch", referenceImage: "", priceRupees: 612000 },
  { column: "assigned", title: "Baby Kada Pair", karigar: "Vijay Verma", material: "28g Gold 22K", deadline: "Apr 5", priority: "medium", customerName: "Meera Iyer", customerMobile: "+91 76543 21098", instructions: "Smooth inner finish", size: "2.2", referenceImage: "", priceRupees: 186000 },
  { column: "assigned", title: "Cluster Ring Repair", karigar: "Deepak Jain", material: "8.5g Gold 18K", deadline: "Apr 3", priority: "high", customerName: "Sunita Reddy", customerMobile: "+91 54321 09876", instructions: "Reset side stones", size: "Ring 7", referenceImage: "", priceRupees: 42000 },
  { column: "assigned", title: "Gold Kada Polishing", karigar: "Rahul Sharma", material: "40g Gold 22K", deadline: "Apr 8", priority: "low", customerName: "Rajesh Patel", customerMobile: "+91 87654 32109", instructions: "Antique polish restore", size: "2.8", referenceImage: "", priceRupees: 8500 },
  { column: "inProgress", title: "Bridal Choker Set", karigar: "Deepak Jain", material: "120g Gold 22K", deadline: "Mar 25", priority: "high", customerName: "Meera Iyer", customerMobile: "+91 76543 21098", instructions: "Heavier center pendant, antique polish", size: "Bridal Full", referenceImage: "", priceRupees: 890000 },
  { column: "inProgress", title: "Gold Bangles Set", karigar: "Vijay Verma", material: "62g Gold 22K", deadline: "Mar 30", priority: "medium", customerName: "Amit Gupta", customerMobile: "+91 65432 10987", instructions: "Lightweight daily wear finish", size: "2.4", referenceImage: "", priceRupees: 198000 },
  { column: "inProgress", title: "Antique Jhumkas", karigar: "Suresh Soni", material: "35g Gold 22K + 6g Gold 18K", deadline: "Mar 29", priority: "medium", customerName: "Priya Sharma", customerMobile: "+91 98765 43210", instructions: "Dual-tone antique", size: "Large", referenceImage: "", priceRupees: 268000 },
  { column: "inProgress", title: "Pearl Setting Repair", karigar: "Kavita Nair", material: "15g Gold 18K", deadline: "Apr 1", priority: "low", customerName: "Neha Sharma", customerMobile: "+91 93333 44112", instructions: "Secure pearl cups", size: "Drop 22mm", referenceImage: "", priceRupees: 35000 },
  { column: "inProgress", title: "Gold Chain Sizing", karigar: "Rahul Sharma", material: "52g Gold 22K", deadline: "Apr 6", priority: "medium", customerName: "Vikram Singh", customerMobile: "+91 98450 12002", instructions: "Remove 2 inches, solder", size: "20 inch target", referenceImage: "", priceRupees: 12000 },
  { column: "completed", title: "Temple Necklace", karigar: "Ramesh Kumar", material: "85g Gold 22K", deadline: "Mar 20", priority: "low", customerName: "Sunita Reddy", customerMobile: "+91 54321 09876", instructions: "Traditional Lakshmi motif", size: "18 inch", referenceImage: "", priceRupees: 520000 },
  { column: "completed", title: "Silver Anklets", karigar: "Vijay Verma", material: "32g Silver 925", deadline: "Mar 18", priority: "low", customerName: "Kavita Nair", customerMobile: "+91 91234 56780", instructions: "Fine chain link with bells", size: "10 inch", referenceImage: "", priceRupees: 18500 },
  { column: "completed", title: "Office Wear Bracelet", karigar: "Suresh Soni", material: "24g Gold 18K", deadline: "Mar 15", priority: "low", customerName: "Anita Desai", customerMobile: "+91 98450 12001", instructions: "Matt finish", size: "7 inch", referenceImage: "", priceRupees: 142000 },
  { column: "completed", title: "Heritage Kada Set", karigar: "Deepak Jain", material: "110g Gold 22K", deadline: "Mar 10", priority: "medium", customerName: "Ramesh Kumar", customerMobile: "+91 98450 11006", instructions: "Engraved borders", size: "Pair 2.6", referenceImage: "", priceRupees: 698000 },
  { column: "completed", title: "Kids Nazaria Bangles", karigar: "Rahul Sharma", material: "18g Gold 22K", deadline: "Mar 8", priority: "low", customerName: "Sanjay Jain", customerMobile: "+91 99887 76655", instructions: "Safety clasp", size: "Kids", referenceImage: "", priceRupees: 118000 },
];

const todayISO = () => new Date().toISOString().slice(0, 10);
const daysAgoISO = (daysAgo) => new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

export const activitySeed = [
  { action: "New sale completed", detail: "Gold Necklace - 22K, 45g", time: "2 min ago", type: "sale", date: todayISO(), read: false },
  { action: "Inventory updated", detail: "Added 12 diamond rings", time: "15 min ago", type: "inventory", date: daysAgoISO(1), read: false },
  { action: "Order delivered", detail: "Order #JW-2847 to Priya Sharma", time: "1 hr ago", type: "delivery", date: daysAgoISO(2), read: false },
  { action: "Karigar completed job", detail: "Bridal set by Ramesh Kumar", time: "2 hrs ago", type: "karigar", date: daysAgoISO(5), read: true },
  { action: "Payment received", detail: "₹3,45,000 from Rajesh Jewellers", time: "3 hrs ago", type: "payment", date: daysAgoISO(8), read: true },
];

export const accountingSeed = [
  { month: "Jan", income: 4200000, expense: 3200000 },
  { month: "Feb", income: 3800000, expense: 2900000 },
  { month: "Mar", income: 5100000, expense: 3800000 },
  { month: "Apr", income: 4700000, expense: 3500000 },
  { month: "May", income: 6200000, expense: 4100000 },
  { month: "Jun", income: 5800000, expense: 3900000 },
];
