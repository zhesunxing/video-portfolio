#!/usr/bin/env swift
// Renders a PDF portfolio into sliced page images for portfolio-pdf.html.
//
// Usage:
//   swift tools/render_portfolio_pages.swift <input.pdf> <out-dir> \
//     [--width 1080] [--chunk 1800] [--quality 0.82] \
//     [--format jpeg|webp] [--suffix ""] [--manifest manifest.json] \
//     [--pages 1-3]
//
// The 1x set keeps the names page-XX-part-YY.jpg. The 2x set uses a suffix,
// e.g. --suffix "@2x" --format webp --width 2160 --chunk 3600.
//
// Writes <out-dir>/<manifest> so generate_site.mjs can pick up intrinsic
// sizes without a hand-maintained dimension table.

import Foundation
import PDFKit
import CoreGraphics
import ImageIO
import UniformTypeIdentifiers

func fail(_ message: String) -> Never {
    FileHandle.standardError.write("error: \(message)\n".data(using: .utf8)!)
    exit(1)
}

func note(_ message: String) {
    print(message)
}

struct Options {
    var input = ""
    var outDir = ""
    var width = 1080
    var chunk = 1800
    var quality = 0.82
    var format = "jpeg"
    var suffix = ""
    var manifest = "manifest.json"
    var firstPage = 1
    var lastPage = Int.max
}

var opts = Options()
var positional: [String] = []
let argv = Array(CommandLine.arguments.dropFirst())

func value(_ index: inout Int, _ name: String) -> String {
    index += 1
    guard index < argv.count else { fail("\(name) needs a value") }
    return argv[index]
}

var index = 0
while index < argv.count {
    let arg = argv[index]
    switch arg {
    case "--width": opts.width = Int(value(&index, arg)) ?? opts.width
    case "--chunk": opts.chunk = Int(value(&index, arg)) ?? opts.chunk
    case "--quality": opts.quality = Double(value(&index, arg)) ?? opts.quality
    case "--format": opts.format = value(&index, arg).lowercased()
    case "--suffix": opts.suffix = value(&index, arg)
    case "--manifest": opts.manifest = value(&index, arg)
    case "--pages":
        let raw = value(&index, arg).split(separator: "-", omittingEmptySubsequences: true)
        if let first = raw.first, let n = Int(first) { opts.firstPage = n }
        if raw.count > 1, let n = Int(raw[1]) { opts.lastPage = n }
    default:
        if arg.hasPrefix("--") { fail("unknown option \(arg)") }
        positional.append(arg)
    }
    index += 1
}

guard positional.count >= 2 else {
    fail("usage: render_portfolio_pages.swift <input.pdf> <out-dir> [options]")
}
opts.input = positional[0]
opts.outDir = positional[1]

guard opts.width > 0, opts.chunk > 0, opts.quality > 0, opts.quality <= 1 else {
    fail("invalid width/chunk/quality")
}

let fileManager = FileManager.default
try? fileManager.createDirectory(atPath: opts.outDir, withIntermediateDirectories: true)

let type: UTType
let fileExtension: String
switch opts.format {
case "jpeg", "jpg":
    type = .jpeg
    fileExtension = "jpg"
case "webp":
    type = .webP
    fileExtension = "webp"
default:
    fail("unsupported format \(opts.format)")
}

guard let document = PDFDocument(url: URL(fileURLWithPath: opts.input)) else {
    fail("cannot open PDF at \(opts.input)")
}

// Drop the previous render of this set so a shorter PDF leaves no stale pages.
let existing = (try? fileManager.contentsOfDirectory(atPath: opts.outDir)) ?? []
let stalePattern = try! NSRegularExpression(pattern: "^page-\\d{2}-part-\\d{2}.*\\.(jpg|webp)$")
for name in existing {
    let range = NSRange(name.startIndex..., in: name)
    guard stalePattern.firstMatch(in: name, range: range) != nil else { continue }
    let matchesSuffix = opts.suffix.isEmpty
        ? !name.contains("@")
        : name.contains("\(opts.suffix).")
    guard matchesSuffix, name.hasSuffix(".\(fileExtension)") else { continue }
    try? fileManager.removeItem(atPath: "\(opts.outDir)/\(name)")
}

var images: [String: [Int]] = [:]
var renderedPages = 0
let lastPage = min(opts.lastPage, document.pageCount)

for pageIndex in (opts.firstPage - 1)..<lastPage {
    guard let page = document.page(at: pageIndex) else { continue }
    let bounds = page.bounds(for: .mediaBox)
    guard bounds.width > 0, bounds.height > 0 else { continue }

    let scale = CGFloat(opts.width) / bounds.width
    let pixelWidth = Int((bounds.width * scale).rounded())
    let pixelHeight = Int((bounds.height * scale).rounded())

    guard let context = CGContext(
        data: nil,
        width: pixelWidth,
        height: pixelHeight,
        bitsPerComponent: 8,
        bytesPerRow: 0,
        space: CGColorSpaceCreateDeviceRGB(),
        bitmapInfo: CGImageAlphaInfo.noneSkipLast.rawValue
    ) else {
        fail("cannot create bitmap context for page \(pageIndex + 1)")
    }

    context.setFillColor(CGColor(red: 1, green: 1, blue: 1, alpha: 1))
    context.fill(CGRect(x: 0, y: 0, width: pixelWidth, height: pixelHeight))
    context.scaleBy(x: scale, y: scale)
    page.draw(with: .mediaBox, to: context)

    guard let fullPage = context.makeImage() else {
        fail("cannot rasterize page \(pageIndex + 1)")
    }

    let pageNumber = String(format: "%02d", pageIndex + 1)
    var offset = 0
    var part = 1

    while offset < pixelHeight {
        let sliceHeight = min(opts.chunk, pixelHeight - offset)
        let cropRect = CGRect(x: 0, y: offset, width: pixelWidth, height: sliceHeight)
        guard let slice = fullPage.cropping(to: cropRect) else {
            fail("cannot slice page \(pageIndex + 1) part \(part)")
        }

        let name = String(format: "page-%@-part-%02d%@.%@", pageNumber, part, opts.suffix, fileExtension)
        let url = URL(fileURLWithPath: opts.outDir).appendingPathComponent(name)

        guard let destination = CGImageDestinationCreateWithURL(url as CFURL, type.identifier as CFString, 1, nil) else {
            fail("cannot encode \(opts.format) on this machine; retry with --format jpeg")
        }
        CGImageDestinationAddImage(destination, slice, [kCGImageDestinationLossyCompressionQuality: opts.quality] as CFDictionary)
        guard CGImageDestinationFinalize(destination) else {
            fail("cannot write \(url.path)")
        }

        images[name] = [pixelWidth, sliceHeight]
        offset += sliceHeight
        part += 1
    }

    renderedPages += 1
    note("page \(pageNumber): \(pixelWidth)x\(pixelHeight) -> \(part - 1) part(s)")
}

let manifest: [String: Any] = [
    "pageCount": document.pageCount,
    "renderedPages": renderedPages,
    "width": opts.width,
    "chunkHeight": opts.chunk,
    "format": fileExtension,
    "images": images,
]

let manifestURL = URL(fileURLWithPath: opts.outDir).appendingPathComponent(opts.manifest)
let data = try JSONSerialization.data(withJSONObject: manifest, options: [.prettyPrinted, .sortedKeys])
try data.write(to: manifestURL)

note("wrote \(images.count) image(s) and \(opts.manifest) for \(renderedPages) page(s)")
