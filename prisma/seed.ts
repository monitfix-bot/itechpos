import { PrismaClient } from "../src/generated/prisma";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const SALE_LAYOUT = `
<div style="font-family: 'Segoe UI', Arial, sans-serif; color: #000; max-width: 100%; margin: 0 auto; padding: 0; line-height: 1.4;">
  <!-- Branding Header -->
  <div style="text-align: center; margin-bottom: 25px;">
    <div style="font-size: 28px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 5px;">{ten_cua_hang}</div>
    <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #333;">{shop_tagline}</div>
    <div style="margin: 10px auto; width: 40px; border-bottom: 3px solid #000;"></div>
    [if:dia_chi_cua_hang]
    <div style="font-size: 10px; margin-top: 8px;">{dia_chi_cua_hang}</div>
    [/if]
    [if:sdt_cua_hang]
    <div style="font-size: 11px; font-weight: bold; margin-top: 2px;">Hotline: {sdt_cua_hang}</div>
    [/if]
  </div>

  <!-- Receipt Title & Info -->
  <div style="display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 12px 0; margin-bottom: 20px;">
    <div style="flex: 1.2;">
      <div style="font-size: 18px; font-weight: 800; text-transform: uppercase;">Hoá đơn bán hàng</div>
      <div style="font-size: 10px; margin-top: 2px; font-weight: 600;">KH: {ten_khach}</div>
    </div>
    <div style="text-align: right; flex: 0.8;">
      <div style="font-size: 11px; font-weight: bold;">#{ma_phieu}</div>
      <div style="font-size: 10px; color: #333;">{ngay_gio_tao}</div>
    </div>
  </div>

  [if:sdt_khach]
  <div style="font-size: 11px; margin-bottom: 15px; padding-bottom: 10px; border-bottom: 1px dashed #ccc;">
    <div style="display: flex; justify-content: space-between;">
      <span>Điện thoại:</span>
      <span style="font-weight: bold;">{sdt_khach}</span>
    </div>
  </div>
  [/if]

  <div style="margin-bottom: 25px;">
    {sanpham}
  </div>

  <div style="padding-top: 10px; font-size: 13px;">
    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
      <span style="text-transform: uppercase; font-size: 11px; font-weight: 600;">Tạm tính:</span>
      <span style="font-weight: bold;">{tam_tinh}</span>
    </div>
    [if:chiet_khau]
    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
      <span style="text-transform: uppercase; font-size: 11px; font-weight: 600;">Chiết khấu:</span>
      <span style="font-weight: bold;">-{chiet_khau}</span>
    </div>
    [/if]
    
    <div style="margin: 15px 0; border-top: 2px solid #000; padding-top: 15px; display: flex; justify-content: space-between; align-items: center;">
      <div style="font-size: 18px; font-weight: 900; text-transform: uppercase;">Thành tiền</div>
      <div style="font-size: 24px; font-weight: 900;">{tong_cong}</div>
    </div>

    <div style="display: flex; justify-content: space-between; margin-top: 8px; font-size: 11px; color: #444;">
      <span>Phương thức thanh toán:</span>
      <span style="font-weight: bold; text-transform: uppercase;">{payment_method}</span>
    </div>
    
    [if:con_no]
    <div style="display: flex; justify-content: space-between; margin-top: 8px; padding-top: 8px; border-top: 1px dashed #000; font-weight: 900; font-size: 14px;">
      <span>CÒN NỢ:</span>
      <span>{con_no}</span>
    </div>
    [/if]
  </div>

  <div style="margin-top: 40px; text-align: center;">
    {qr}
    <div style="margin: 20px auto; width: 60px; border-bottom: 1px solid #000;"></div>
    <div style="font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px;">Cảm ơn quý khách!</div>
    <div style="font-size: 10px; margin-top: 5px; font-style: italic;">Hóa đơn có giá trị bảo hành theo từng linh kiện.</div>
    <div style="margin-top: 15px; font-size: 9px; font-weight: bold;">{ten_cua_hang} - CHẤT LƯỢNG LÀM NÊN THƯƠNG HIỆU</div>
  </div>
</div>
`.trim();

const INTAKE_LAYOUT = `
<div style="font-family: 'Segoe UI', Arial, sans-serif; color: #000; max-width: 100%; margin: 0 auto; padding: 0; line-height: 1.4;">
  <!-- Branding Header -->
  <div style="text-align: center; margin-bottom: 25px;">
    <div style="font-size: 26px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">{ten_cua_hang}</div>
    <div style="font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #333;">{shop_tagline}</div>
    <div style="margin: 10px auto; width: 40px; border-bottom: 2px solid #000;"></div>
    [if:dia_chi_cua_hang]
    <div style="font-size: 10px; margin-top: 5px;">Đ/C: {dia_chi_cua_hang}</div>
    [/if]
    [if:sdt_cua_hang]
    <div style="font-size: 11px; font-weight: bold; margin-top: 2px;">Hotline: {sdt_cua_hang}</div>
    [/if]
  </div>

  <!-- Document Header -->
  <div style="display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 12px 0; margin-bottom: 20px;">
    <div style="flex: 1.2;">
      <div style="font-size: 18px; font-weight: 800; text-transform: uppercase;">Phiếu tiếp nhận máy</div>
      <div style="font-size: 10px; margin-top: 2px; font-weight: 600;">KH: {ten_khach}</div>
    </div>
    <div style="text-align: right; flex: 0.8;">
      <div style="font-size: 11px; font-weight: bold;">#{ma_phieu}</div>
      <div style="font-size: 10px; color: #333;">{ngay_gio_tao}</div>
    </div>
  </div>

  <!-- Customer & Device Details Grid -->
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 20px; font-size: 11px;">
    <div style="border-right: 1px dashed #ccc; padding-right: 15px;">
      <div style="font-size: 9px; font-weight: bold; text-transform: uppercase; margin-bottom: 8px; border-bottom: 1px solid #000; padding-bottom: 2px;">Khách hàng</div>
      <div style="margin-bottom: 4px;">SĐT: <b>{sdt_khach}</b></div>
      [if:dia_chi_khach]
      <div>Đ/C: {dia_chi_khach}</div>
      [/if]
    </div>
    <div>
      <div style="font-size: 9px; font-weight: bold; text-transform: uppercase; margin-bottom: 8px; border-bottom: 1px solid #000; padding-bottom: 2px;">Thiết bị tiếp nhận</div>
      <div style="margin-bottom: 4px;">Model: <b>{loai_may}</b></div>
      [if:imei_serial]
      <div style="margin-bottom: 4px;">IMEI/SN: <span style="font-family: monospace;">{imei_serial}</span></div>
      [/if]
      [if:phu_kien]
      <div>Phụ kiện: {phu_kien}</div>
      [/if]
    </div>
  </div>

  <!-- Inspection Status -->
  <div style="margin-bottom: 20px; font-size: 11px; border: 1px solid #000; padding: 10px;">
    [if:tinh_trang_may]
    <div style="margin-bottom: 6px;">
      <b>Ngoại quan:</b> {tinh_trang_may}
    </div>
    [/if]
    <div>
      <b>Hiện tượng lỗi:</b> {yeu_cau_khach}
    </div>
  </div>

  <!-- Cost & Timeline Breakdown -->
  <div style="margin-bottom: 30px; font-size: 12px; border-top: 1px solid #000; padding-top: 10px;">
    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
      <span>Dự toán chi phí:</span>
      <span style="font-weight: bold;">{du_kien_chi_phi}</span>
    </div>
    [if:tien_dat_coc]
    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
      <span>Tiền đã cọc:</span>
      <span style="font-weight: bold;">{tien_dat_coc}</span>
    </div>
    [/if]
    [if:ngay_hen_tra]
    <div style="display: flex; justify-content: space-between; margin-top: 10px; border-top: 1px dashed #ccc; padding-top: 6px;">
      <span>Hẹn trả dự kiến:</span>
      <span style="font-weight: 800;">{ngay_hen_tra}</span>
    </div>
    [/if]
  </div>

  <!-- Signatures -->
  <div style="display: flex; justify-content: space-between; text-align: center; margin-top: 30px; font-size: 11px;">
    <div style="width: 45%;">
      <div style="font-weight: bold; text-transform: uppercase;">Khách hàng</div>
      <div style="font-size: 9px; font-style: italic;">(Ký & ghi rõ họ tên)</div>
      <div style="height: 50px;"></div>
      <div style="border-bottom: 1px dotted #ccc; width: 80%; margin: 0 auto;"></div>
    </div>
    <div style="width: 45%;">
      <div style="font-weight: bold; text-transform: uppercase;">Nhân viên tiếp nhận</div>
      <div style="font-size: 9px; font-style: italic;">(Ký & ghi rõ họ tên)</div>
      <div style="height: 50px;"></div>
      <div style="font-weight: bold;">{ktv_phu_trach}</div>
    </div>
  </div>
</div>
`.trim();

const RETURN_LAYOUT = `
<div style="font-family: 'Segoe UI', Arial, sans-serif; color: #000; max-width: 100%; margin: 0 auto; padding: 0; line-height: 1.4;">
  <!-- Branding Header -->
  <div style="text-align: center; margin-bottom: 25px;">
    <div style="font-size: 26px; font-weight: 900; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 5px;">{ten_cua_hang}</div>
    <div style="font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px; color: #333;">{shop_tagline}</div>
    <div style="margin: 10px auto; width: 40px; border-bottom: 2px solid #000;"></div>
    [if:dia_chi_cua_hang]
    <div style="font-size: 10px; margin-top: 5px;">Đ/C: {dia_chi_cua_hang}</div>
    [/if]
    [if:sdt_cua_hang]
    <div style="font-size: 11px; font-weight: bold; margin-top: 2px;">Hotline: {sdt_cua_hang}</div>
    [/if]
  </div>

  <!-- Document Header -->
  <div style="display: flex; justify-content: space-between; align-items: flex-end; border-top: 1px solid #000; border-bottom: 1px solid #000; padding: 12px 0; margin-bottom: 20px;">
    <div style="flex: 1.2;">
      <div style="font-size: 18px; font-weight: 800; text-transform: uppercase;">Phiếu bàn giao & Bảo hành</div>
      <div style="font-size: 10px; margin-top: 2px; font-weight: 600;">KH: {ten_khach}</div>
    </div>
    <div style="text-align: right; flex: 0.8;">
      <div style="font-size: 11px; font-weight: bold;">#{ma_phieu}</div>
      <div style="font-size: 10px; color: #333;">{ngay_gio_tao}</div>
    </div>
  </div>

  <!-- Device Info -->
  <div style="margin-bottom: 20px; font-size: 11px; border: 1px solid #000; padding: 10px;">
    <div style="margin-bottom: 4px;"><b>Thiết bị:</b> {loai_may}</div>
    [if:imei_serial]
    <div style="margin-bottom: 4px;"><b>IMEI/SN:</b> {imei_serial}</div>
    [/if]
    [if:giai_phap_sua]
    <div style="margin-bottom: 4px;"><b>Giải pháp sửa chữa:</b> {giai_phap_sua}</div>
    [/if]
    [if:thoi_gian_bao_hanh]
    <div style="color: #059669; font-weight: bold;">Thời hạn bảo hành: {thoi_gian_bao_hanh}</div>
    [/if]
  </div>

  <!-- Replacement parts list -->
  <div style="margin-bottom: 20px;">
    {sanpham}
  </div>

  <!-- Total & Payment -->
  <div style="font-size: 13px; border-top: 1px solid #000; padding-top: 10px; margin-bottom: 30px;">
    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
      <span>Tổng chi phí:</span>
      <span style="font-weight: bold;">{tong_chi_phi}</span>
    </div>
    [if:tien_dat_coc]
    <div style="display: flex; justify-content: space-between; margin-bottom: 6px;">
      <span>Đã trừ cọc:</span>
      <span style="font-weight: bold;">-{tien_dat_coc}</span>
    </div>
    [/if]
    <div style="display: flex; justify-content: space-between; border-top: 2px solid #000; padding-top: 10px; font-size: 18px; font-weight: 900;">
      <span>THANH TOÁN:</span>
      <span>{thuc_thu}</span>
    </div>
  </div>

  <div style="margin-top: 30px; text-align: center;">
    {qr}
    <div style="font-size: 12px; font-weight: bold; margin-top: 15px;">Cảm ơn quý khách đã tin tưởng sử dụng dịch vụ!</div>
  </div>
</div>
`.trim();

async function main() {
  console.log("Starting Personal POS seeding...");

  // 1. Create Main Branch
  const mainBranch = await prisma.branch.upsert({
    where: { id: "branch-main" },
    update: {},
    create: {
      id: "branch-main",
      name: "Cửa hàng chính",
      address: "123 Đường Công Nghệ, Quận 1, TP.HCM",
      phone: "0901234567",
      isMain: true,
    }
  });

  // 2. Create Default Settings
  await prisma.appSetting.upsert({
    where: { id: "default" },
    update: {},
    create: {
      id: "default",
      shopName: "TechShop POS",
      siteTitle: "TechShop - Quản lý Cửa Hàng & Sửa Chữa Laptop / Điện Thoại",
      shopTagline: "Chuyên Sửa Chữa & Bán Lẻ Laptop, Điện Thoại",
      shopAddress: "123 Đường Công Nghệ, Quận 1, TP.HCM",
      shopPhone: "0901234567",
      shopEmail: "contact@techshop.vn",
      printSize: "A4",
    }
  });

  // 3. Create Admin User
  const adminPwd = await bcrypt.hash("admin123", 10);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@techshop.com" },
    update: { password: adminPwd, role: "admin", isSuperAdmin: true },
    create: {
      email: "admin@techshop.com",
      name: "Admin Quản Trị",
      password: adminPwd,
      role: "admin",
      isSuperAdmin: true,
      branchId: mainBranch.id,
    }
  });

  // 3b. Create Technician User
  const techUser = await prisma.user.upsert({
    where: { email: "tuan.ktv@techshop.com" },
    update: {},
    create: {
      email: "tuan.ktv@techshop.com",
      name: "KTV Tuấn Minh",
      password: adminPwd,
      role: "technician",
      isSuperAdmin: false,
      branchId: mainBranch.id,
    }
  });

  // 4. Default Categories
  const defaultCats = [
    { name: "Laptop", slug: "laptop", type: "laptop", skuPrefix: "LT", icon: "laptop" },
    { name: "Điện thoại", slug: "dien-thoai", type: "phone", skuPrefix: "DT", icon: "smartphone" },
    { name: "Phụ kiện", slug: "phu-kien", type: "accessory", skuPrefix: "PK", icon: "headphones" },
    { name: "Sửa chữa", slug: "dich-vu", type: "service", skuPrefix: "DV", icon: "wrench" },
  ];

  const catMap: Record<string, string> = {};
  for (const cat of defaultCats) {
    const c = await prisma.category.upsert({
      where: { slug: cat.slug },
      update: {},
      create: cat,
    });
    catMap[cat.slug] = c.id;
  }

  // 5. Sample Products
  const sampleProducts = [
    {
      sku: "LT-001",
      name: "MacBook Pro 14 M2 Pro 16GB / 512GB Space Gray",
      brand: "Apple",
      price: 32500000,
      costPrice: 28000000,
      stock: 6,
      categoryId: catMap["laptop"],
      warranty: 12,
    },
    {
      sku: "LT-002",
      name: "Dell XPS 13 Plus 9320 i7-1360P 16GB / 512GB OLED",
      brand: "Dell",
      price: 29000000,
      costPrice: 24500000,
      stock: 4,
      categoryId: catMap["laptop"],
      warranty: 12,
    },
    {
      sku: "DT-001",
      name: "iPhone 14 Pro Max 128GB Deep Purple Q.Tế",
      brand: "Apple",
      price: 18500000,
      costPrice: 16000000,
      stock: 9,
      categoryId: catMap["dien-thoai"],
      warranty: 6,
    },
    {
      sku: "DT-002",
      name: "Samsung Galaxy S23 Ultra 256GB Phantom Black",
      brand: "Samsung",
      price: 16800000,
      costPrice: 14500000,
      stock: 5,
      categoryId: catMap["dien-thoai"],
      warranty: 6,
    },
    {
      sku: "PK-001",
      name: "Củ sạc nhanh Anker 735 GaNPrime 65W 3 cổng",
      brand: "Anker",
      price: 750000,
      costPrice: 480000,
      stock: 35,
      categoryId: catMap["phu-kien"],
      warranty: 18,
    },
    {
      sku: "PK-002",
      name: "Cáp sạc Baseus Type-C to C 100W dù bền bỉ 1.2m",
      brand: "Baseus",
      price: 150000,
      costPrice: 75000,
      stock: 50,
      categoryId: catMap["phu-kien"],
      warranty: 12,
    },
    {
      sku: "DV-001",
      name: "Thay màn hình iPhone 13 Pro Zin bóc máy",
      brand: "Apple",
      price: 3200000,
      costPrice: 2500000,
      stock: 99,
      categoryId: catMap["dich-vu"],
      warranty: 6,
    },
    {
      sku: "DV-002",
      name: "Vệ sinh + Tra keo tản nhiệt gốm Laptop Gaming",
      brand: "Dịch vụ",
      price: 200000,
      costPrice: 30000,
      stock: 99,
      categoryId: catMap["dich-vu"],
      warranty: 1,
    },
    {
      sku: "DV-003",
      name: "Thay Pin Zin MacBook Pro 13/14 inch",
      brand: "Apple",
      price: 1450000,
      costPrice: 950000,
      stock: 99,
      categoryId: catMap["dich-vu"],
      warranty: 6,
    },
  ];

  for (const p of sampleProducts) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p,
    });
  }

  // 6. Sample Customers
  const sampleCustomers = [
    {
      code: "KH001",
      name: "Nguyễn Văn An",
      phone: "0988123456",
      email: "an.nguyen@gmail.com",
      address: "45 Lê Lợi, P. Bến Nghé, Quận 1",
    },
    {
      code: "KH002",
      name: "Trần Thị Mai",
      phone: "0912345678",
      email: "mai.tran@gmail.com",
      address: "12 Võ Văn Tần, Quận 3",
    },
    {
      code: "KH003",
      name: "Lê Hoàng Nam",
      phone: "0909888999",
      email: "nam.le@gmail.com",
      address: "88 Nguyễn Thị Minh Khai, Quận 1",
    },
  ];

  const custMap: Record<string, string> = {};
  for (const c of sampleCustomers) {
    const cust = await prisma.customer.upsert({
      where: { phone: c.phone },
      update: {},
      create: c,
    });
    custMap[c.code] = cust.id;
  }

  // 7. Sample Repair Tickets
  const sampleTicket = await prisma.serviceTicket.upsert({
    where: { code: "SC0001" },
    update: {},
    create: {
      code: "SC0001",
      deviceType: "laptop",
      deviceBrand: "Dell",
      deviceModel: "XPS 13 9310",
      imei: "DLXPS9310-8842",
      accessories: "Sạc Type-C 45W Zin",
      appearance: "Móp nhẹ góc phải nắp lưng, màn hình còn đẹp",
      problem: "Mở máy không lên nguồn, cắm sạc đèn báo chớp cam 3 nhịp",
      diagnosis: "Lỗi mạch sạc nguồn sơ cấp 19V, chập tụ bảo vệ đường VCC_MAIN",
      estimatedCost: 1200000,
      deposit: 200000,
      paid: 200000,
      warranty: 3,
      status: "repairing",
      customerId: custMap["KH001"],
      createdById: adminUser.id,
      assignedToId: techUser.id,
      branchId: mainBranch.id,
      promisedAt: new Date(Date.now() + 48 * 60 * 60 * 1000),
    }
  });

  // 8. Default Templates
  const templates = [
    { slug: "sale-receipt", name: "Hóa đơn bán hàng", content: SALE_LAYOUT },
    { slug: "service-intake", name: "Phiếu nhận máy", content: INTAKE_LAYOUT },
    { slug: "service-return", name: "Phiếu trả máy", content: RETURN_LAYOUT },
  ];

  for (const t of templates) {
    await prisma.printTemplate.upsert({
      where: { slug: t.slug },
      update: { content: t.content },
      create: t,
    });
  }

  console.log("Personal POS Seeding COMPLETE with Sample Data! 🚀");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
