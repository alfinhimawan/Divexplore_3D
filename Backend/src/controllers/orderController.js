"use strict";
const Joi = require("joi");
const orderService = require("../services/orderService");
const vendorService = require("../services/vendorService");

// Schema Validasi
const createOrderSchema = Joi.object({
  items: Joi.array()
    .items(
      Joi.object({
        product_id: Joi.string().uuid().required(),
        qty: Joi.number().integer().min(1).required(),
        addon_ids: Joi.array().items(Joi.string().uuid()).optional(),
        // Sertakan tanggal agar divalidasi controller
        booking_date: Joi.string().optional().allow(null, ""),
        check_in: Joi.string().optional().allow(null, ""),
        check_out: Joi.string().optional().allow(null, "")
      }),
    )
    .min(1)
    .required(),
  kode_promo: Joi.string().optional().allow(null, ""),
  user_info: Joi.object({
    nama: Joi.string().optional(),
    no_hp: Joi.string().optional(),
    email: Joi.string().email().optional()
  }).optional()
});

// POST /api/orders
const createOrder = async (req, res, next) => {
  try {
    const { error, value } = createOrderSchema.validate(req.body, {
      abortEarly: false,
    });
    if (error) {
      return res.status(400).json({
        status: "error",
        message: error.details.map((d) => d.message).join(", "),
      });
    }

    // Eksekusi pembuatan order
    const result = await orderService.createOrder(
      req.user.id,
      value.items,
      value.kode_promo,
      value.user_info
    );

    res.status(201).json({
      status: "success",
      message:
        "Pesanan berhasil dibuat. Silakan selesaikan pembayaran dalam 15 menit.",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders/me
const getMyOrders = async (req, res, next) => {
  try {
    const orders = await orderService.getWisatawanOrders(req.user.id);
    res.status(200).json({
      status: "success",
      data: { orders, total: orders.length },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders/:id/invoice
const downloadInvoice = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    // Panggil service untuk mendapatkan order (sudah ada validasi kepemilikan di dalam service)
    const order = await orderService.getOrderById(orderId, req.user.id);

    // Generate PDF Buffer
    const pdfService = require("../services/pdfService");
    const pdfBuffer = await pdfService.generateInvoiceBuffer(order);

    // Set Header Response agar browser otomatis mendownload file PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=Invoice_${order.id}.pdf`,
    );
    res.setHeader("Content-Length", pdfBuffer.length);

    res.end(pdfBuffer);
  } catch (err) {
    next(err);
  }
};

// GET /api/orders/vendor
const getVendorOrders = async (req, res, next) => {
  try {
    const vendor = await vendorService.getMyVendor(req.user.id);
    const orders = await orderService.getVendorOrders(vendor.id);
    res.status(200).json({
      status: "success",
      data: { orders, total: orders.length },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders/admin
const getAdminOrders = async (req, res, next) => {
  try {
    const orders = await orderService.getAdminOrders();
    res.status(200).json({
      status: "success",
      data: { orders, total: orders.length },
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders/:id/snap-token
const getSnapToken = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const result = await orderService.getSnapToken(orderId, req.user.id);
    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders/:id
const getOrderDetail = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const order = await orderService.getOrderById(orderId, req.user.id);
    res.status(200).json({
      status: "success",
      data: order,
    });
  } catch (err) {
    next(err);
  }
};

// GET /api/orders/:id/payment-status
const getPaymentStatus = async (req, res, next) => {
  try {
    const orderId = req.params.id;
    const result = await orderService.getPaymentStatus(orderId, req.user.id);
    res.status(200).json({
      status: "success",
      data: result,
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createOrder,
  getMyOrders,
  downloadInvoice,
  getVendorOrders,
  getAdminOrders,
  getSnapToken,
  getPaymentStatus,
  getOrderDetail,
};
