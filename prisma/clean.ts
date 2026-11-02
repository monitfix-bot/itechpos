import { PrismaClient } from "../src/generated/prisma";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Bắt đầu dọn sạch toàn bộ dữ liệu mẫu hệ thống...");

  // 1. Xóa các bảng giao dịch & chi tiết
  const delSaleItems = await prisma.saleItem.deleteMany();
  console.log(`  ✓ Đã xóa ${delSaleItems.count} chi tiết hóa đơn (SaleItem)`);

  const delSales = await prisma.sale.deleteMany();
  console.log(`  ✓ Đã xóa ${delSales.count} hóa đơn bán hàng (Sale)`);

  const delHistory = await prisma.serviceStatusHistory.deleteMany();
  console.log(`  ✓ Đã xóa ${delHistory.count} lịch sử trạng thái sửa chữa`);

  const delServiceItems = await prisma.serviceItem.deleteMany();
  console.log(`  ✓ Đã xóa ${delServiceItems.count} linh kiện sửa chữa (ServiceItem)`);

  const delTickets = await prisma.serviceTicket.deleteMany();
  console.log(`  ✓ Đã xóa ${delTickets.count} phiếu sửa chữa (ServiceTicket)`);

  const delStockMovements = await prisma.stockMovement.deleteMany();
  console.log(`  ✓ Đã xóa ${delStockMovements.count} lịch sử xuất nhập kho (StockMovement)`);

  const delBranchStocks = await prisma.productBranchStock.deleteMany();
  console.log(`  ✓ Đã xóa ${delBranchStocks.count} tồn kho chi nhánh`);

  const delProducts = await prisma.product.deleteMany();
  console.log(`  ✓ Đã xóa ${delProducts.count} sản phẩm & linh kiện mẫu (Product)`);

  const delCustomers = await prisma.customer.deleteMany();
  console.log(`  ✓ Đã xóa ${delCustomers.count} khách hàng mẫu (Customer)`);

  const delNotifications = await prisma.notification.deleteMany();
  console.log(`  ✓ Đã xóa ${delNotifications.count} thông báo (Notification)`);

  // 2. Xóa các tài khoản kiểm thử không phải Admin (giữ lại Quản trị viên Admin)
  const delUsers = await prisma.user.deleteMany({
    where: {
      role: { not: "admin" },
      isSuperAdmin: false,
    },
  });
  console.log(`  ✓ Đã xóa ${delUsers.count} tài khoản nhân viên phụ (chỉ giữ lại Admin)`);

  // 3. Reset các bộ đếm số thứ tự mã hóa đơn, mã phiếu sửa, mã khách hàng về 0
  await prisma.appSetting.updateMany({
    data: {
      lastSaleNumber: 0,
      lastTicketNumber: 0,
      lastCustomerNumber: 0,
    },
  });
  console.log("  ✓ Đã đặt lại bộ đếm số phiếu về 0 (Đơn tiếp theo sẽ bắt đầu từ #HD00001, #SC00001, #KH001)");

  const adminList = await prisma.user.findMany({
    where: { role: "admin" },
    select: { email: true, name: true },
  });

  console.log("\n==========================================");
  console.log("🎉 HỆ THỐNG ĐÃ ĐƯỢC DỌN SẠCH HOÀN TOÀN!");
  console.log("Tài khoản Quản trị viên (Admin) duy nhất còn lại:");
  adminList.forEach((a) => console.log(`  - ${a.name} (${a.email})`));
  console.log("Toàn bộ cấu hình cửa hàng, chi nhánh và mẫu in đều được bảo toàn 100%.");
  console.log("==========================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Lỗi khi dọn dẹp:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
