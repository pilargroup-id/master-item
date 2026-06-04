-- ============================================================
-- SKU GENERATOR - Database Migration
-- Database: newitem
-- Engine: MariaDB / MySQL InnoDB
-- Charset: utf8mb4
-- ============================================================

CREATE DATABASE IF NOT EXISTS `newitem`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_general_ci;

USE `newitem`;

-- ============================================================
-- USER TABLE (untuk auth standalone, reference ke pilargroup)
-- ============================================================
CREATE TABLE IF NOT EXISTS `sku_users` (
  `id` VARCHAR(36) NOT NULL,
  `name` VARCHAR(150) NOT NULL,
  `username` VARCHAR(150) UNIQUE NOT NULL,
  `password` VARCHAR(255) NOT NULL,
  `division` ENUM('product','goto_ecommerce','admin') NOT NULL DEFAULT 'goto_ecommerce',
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Seed: default users (password: password)
-- Hash '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi' = 'password'
INSERT IGNORE INTO `sku_users` (`id`, `name`, `username`, `password`, `division`) VALUES
('usr-admin-0001', 'Administrator', 'admin', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin'),
('usr-product-001', 'Divisi Product', 'product', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'product'),
('usr-goto-0001', 'Divisi GoTo Ecommerce', 'goto', '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'goto_ecommerce');

-- ============================================================
-- SEQUENCE POOL 1: Parent SKU (P000001, P000002, ...)
-- Setiap INSERT menghasilkan ID baru sebagai sequence number
-- ============================================================
CREATE TABLE IF NOT EXISTS `seq_sku_parent` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 AUTO_INCREMENT=1;

-- ============================================================
-- SEQUENCE POOL 2: Variant + Bundle SKU (SHARED, CONTINUOUS)
-- Format: 68 + YY(tahun) + 8digit(seq_id)
-- TIDAK RESET antar tahun - sequence berlanjut terus
-- ============================================================
CREATE TABLE IF NOT EXISTS `seq_sku_variant_bundle` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  `item_type` ENUM('variant','bundle') NOT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 AUTO_INCREMENT=1;

-- ============================================================
-- KATEGORI PRODUK
-- ============================================================
CREATE TABLE IF NOT EXISTS `sku_categories` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `name` VARCHAR(100) NOT NULL,
  `description` VARCHAR(255) DEFAULT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 1,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Seed kategori dasar
INSERT IGNORE INTO `sku_categories` (`id`, `name`, `description`) VALUES
(1, 'Fashion Pria', 'Pakaian dan aksesori pria'),
(2, 'Fashion Wanita', 'Pakaian dan aksesori wanita'),
(3, 'Fashion Anak', 'Pakaian dan aksesori anak-anak'),
(4, 'Sepatu', 'Semua jenis alas kaki'),
(5, 'Tas & Koper', 'Tas, ransel, koper'),
(6, 'Aksesori', 'Perhiasan, jam tangan, kacamata'),
(7, 'Perawatan Diri', 'Kosmetik, skincare, perawatan tubuh'),
(8, 'Elektronik', 'Gadget dan elektronik'),
(9, 'Rumah Tangga', 'Peralatan dan dekorasi rumah'),
(10, 'Olahraga', 'Perlengkapan olahraga dan outdoor');

-- ============================================================
-- PARENT ITEM
-- Entitas konseptual produk - tidak memiliki stok langsung
-- SKU Format: P000001, P000002, ...
-- ============================================================
CREATE TABLE IF NOT EXISTS `item_parents` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `parent_sku` VARCHAR(10) UNIQUE NOT NULL COMMENT 'Format: P + 6 digit urutan',
  `brand_id` INT DEFAULT NULL,
  `brand_name` VARCHAR(100) DEFAULT NULL,
  `sub_brand` VARCHAR(100) DEFAULT NULL,
  `item_name` VARCHAR(150) DEFAULT NULL,
  `category_id` INT DEFAULT NULL,
  `detail_category_id` INT DEFAULT NULL,
  `item_type_id` INT DEFAULT NULL,
  `port_id` INT DEFAULT NULL,
  `business_unit` VARCHAR(100) DEFAULT NULL,
  `base_name` VARCHAR(150) NOT NULL COMMENT 'Nama dasar produk (Auto-generated dari Brand + Sub Brand + Item Name)',
  `description` TEXT DEFAULT NULL,
  `created_by` VARCHAR(36) DEFAULT NULL,
  `updated_by` VARCHAR(36) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_parent_sku` (`parent_sku`),
  KEY `idx_category` (`category_id`),
  KEY `idx_brand` (`brand_name`),
  KEY `idx_brand_id` (`brand_id`),
  CONSTRAINT `fk_parent_category` FOREIGN KEY (`category_id`)
    REFERENCES `sku_categories` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- VARIANT ITEM
-- Produk fisik turunan dari Parent, memiliki stok dan logistik
-- SKU Format: 68 + YY + 8digit_seq
-- ============================================================
CREATE TABLE IF NOT EXISTS `item_variants` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `parent_id` INT NOT NULL,
  `variant_sku` VARCHAR(15) UNIQUE NOT NULL COMMENT 'Format: 68YY00000001',
  `model_type` VARCHAR(100) DEFAULT NULL COMMENT 'Model/desain: Slim Fit, Casual, Sporty',
  `color_size` VARCHAR(100) DEFAULT NULL COMMENT 'Warna / Ukuran: Merah / XL',
  `size_color` VARCHAR(100) DEFAULT NULL COMMENT 'Ukuran / Warna: XL / Merah',
  `unit` VARCHAR(20) DEFAULT 'PCS' COMMENT 'Satuan: PCS, BOX, PACK, PAIR',
  `qty_pack` INT DEFAULT 1 COMMENT 'Kuantitas per kemasan',
  `height_cm` DECIMAL(10,2) DEFAULT NULL COMMENT 'Tinggi produk dalam cm',
  `weight_gr` DECIMAL(10,2) DEFAULT NULL COMMENT 'Berat bersih dalam gram',
  `dimension_l` DECIMAL(10,2) DEFAULT NULL COMMENT 'Panjang (cm)',
  `dimension_w` DECIMAL(10,2) DEFAULT NULL COMMENT 'Lebar (cm)',
  `dimension_h` DECIMAL(10,2) DEFAULT NULL COMMENT 'Tinggi dimensi (cm)',
  `gross_weight_gr` DECIMAL(10,2) DEFAULT NULL COMMENT 'Berat kotor dengan kemasan dalam gram',
  `notes` TEXT DEFAULT NULL,
  `created_by` VARCHAR(36) DEFAULT NULL,
  `updated_by` VARCHAR(36) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_variant_sku` (`variant_sku`),
  KEY `idx_parent_id` (`parent_id`),
  CONSTRAINT `fk_variant_parent` FOREIGN KEY (`parent_id`)
    REFERENCES `item_parents` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- BUNDLE ITEM
-- Paket komersial yang menggabungkan satu atau lebih Variant
-- SKU Format: 68 + YY + 8digit_seq (SHARED POOL dengan Variant)
-- ============================================================
CREATE TABLE IF NOT EXISTS `item_bundles` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `bundle_sku` VARCHAR(15) UNIQUE NOT NULL COMMENT 'Format: 68YY00000002 (shared pool dengan variant)',
  `bundle_name` VARCHAR(150) NOT NULL,
  `description` TEXT DEFAULT NULL,
  `created_by_div` VARCHAR(50) DEFAULT NULL COMMENT 'Divisi pembuat: product / goto_ecommerce',
  `created_by` VARCHAR(36) DEFAULT NULL,
  `updated_by` VARCHAR(36) DEFAULT NULL,
  `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_bundle_sku` (`bundle_sku`),
  KEY `idx_bundle_name` (`bundle_name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- BUNDLE DETAIL
-- Relasi Bundle → Variant dengan kuantitas
-- ============================================================
CREATE TABLE IF NOT EXISTS `item_bundle_details` (
  `id` INT NOT NULL AUTO_INCREMENT,
  `bundle_id` INT NOT NULL,
  `variant_id` INT NOT NULL,
  `quantity` INT NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uq_bundle_variant` (`bundle_id`, `variant_id`),
  KEY `idx_bundle_id` (`bundle_id`),
  KEY `idx_variant_id` (`variant_id`),
  CONSTRAINT `fk_detail_bundle` FOREIGN KEY (`bundle_id`)
    REFERENCES `item_bundles` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_detail_variant` FOREIGN KEY (`variant_id`)
    REFERENCES `item_variants` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- ============================================================
-- VIEW: Variant lengkap dengan info Parent
-- ============================================================
CREATE OR REPLACE VIEW `v_variants_full` AS
SELECT
  iv.id,
  iv.variant_sku,
  iv.parent_id,
  ip.parent_sku,
  ip.base_name AS parent_name,
  ip.brand_name,
  sc.name AS category_name,
  iv.model_type,
  iv.color_size,
  iv.size_color,
  iv.unit,
  iv.qty_pack,
  iv.height_cm,
  iv.weight_gr,
  iv.dimension_l,
  iv.dimension_w,
  iv.dimension_h,
  iv.gross_weight_gr,
  iv.notes,
  iv.created_at,
  iv.updated_at
FROM `item_variants` iv
JOIN `item_parents` ip ON iv.parent_id = ip.id
LEFT JOIN `sku_categories` sc ON ip.category_id = sc.id;

-- ============================================================
-- VIEW: Bundle lengkap dengan detail items
-- ============================================================
CREATE OR REPLACE VIEW `v_bundles_summary` AS
SELECT
  ib.id,
  ib.bundle_sku,
  ib.bundle_name,
  ib.description,
  ib.created_by_div,
  COUNT(ibd.id) AS total_variants,
  SUM(ibd.quantity) AS total_qty,
  ib.created_at,
  ib.updated_at
FROM `item_bundles` ib
LEFT JOIN `item_bundle_details` ibd ON ib.id = ibd.bundle_id
GROUP BY ib.id;
