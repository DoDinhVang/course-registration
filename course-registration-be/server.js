import express from "express";
import compression from "compression";
const app = express();

//middlewares
app.use(express.json());
app.use(compression());
// app.use(cors({ origin: ["http://localhost:3000", "http://google.com"] }));

// app.use(cookieParser()); //middleware để parse cookie từ request

// app.use(express.static("public"));

//swagger

//router
app.get("/", (req, res) => {
  res.send("Hello World!");
});

const PORT = 3000;
const server = app.listen(PORT, () => {
  console.log(`server online at port: ${PORT}`);
});

//prisma
// npx prisma db pull -> tự động tạo model dựa trên database đã có sẵn (db first)

// npx prisma db push -> tự động tạo database dựa trên model đã định nghĩa sẵn (code first)
