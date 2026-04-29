const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({
  origin: process.env.FRONTEND_URL || "*",
  methods: ["GET", "POST", "PUT", "DELETE"],
  allowedHeaders: ["Content-Type"],
}));
app.use(express.json());

// In-memory data store — resets when server restarts
let inventory = [
  { id: 1, name: "Arduino Kit",    category: "Hardware",    quantity: 5,  status: "Available"   },
  { id: 2, name: "Figma License",  category: "Software",    quantity: 20, status: "Available"   },
  { id: 3, name: "USB-C Cable",    category: "Accessories", quantity: 0,  status: "Unavailable" },
  { id: 4, name: "Monitor 4K",     category: "Hardware",    quantity: 3,  status: "Available"   },
  { id: 5, name: "Notion License", category: "Software",    quantity: 15, status: "Available"   },
];
let nextId = 6;

// Health check
app.get("/", (_req, res) => {
  res.json({ message: "Inventory API is running!" });
});

// GET /inventory
app.get("/inventory", (_req, res) => {
  res.json(inventory);
});

// POST /inventory
app.post("/inventory", (req, res) => {
  const { name, category, quantity, status } = req.body;
  if (!name || !category || quantity === undefined || !status) {
    return res.status(400).json({ message: "All fields are required" });
  }
  const newItem = { id: nextId++, name, category, quantity: parseInt(quantity), status };
  inventory.push(newItem);
  res.status(201).json({ message: "item added successfully", item: newItem });
});

// PUT /inventory/:id
app.put("/inventory/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const index = inventory.findIndex((i) => i.id === id);
  if (index === -1) return res.status(404).json({ message: "Item not found" });
  const { name, category, quantity, status } = req.body;
  inventory[index] = {
    ...inventory[index],
    name:     name     ?? inventory[index].name,
    category: category ?? inventory[index].category,
    quantity: quantity !== undefined ? parseInt(quantity) : inventory[index].quantity,
    status:   status   ?? inventory[index].status,
  };
  res.json({ message: "item updated successfully", item: inventory[index] });
});

// DELETE /inventory/:id
app.delete("/inventory/:id", (req, res) => {
  const id = parseInt(req.params.id);
  const index = inventory.findIndex((i) => i.id === id);
  if (index === -1) return res.status(404).json({ message: "Item not found" });
  const removed = inventory.splice(index, 1)[0];
  res.json({ message: "item deleted successfully", item: removed });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
