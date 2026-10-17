"""
Generate the three sample supplier quotes used by AsliRate's demo mode.

    python3 scripts/generate-samples.py

Writes to public/samples/. All businesses, people and GSTINs are fictional.
The figures must match src/lib/demo/sample-quotes.ts (the engine's reference
test) and the source snippets in src/lib/demo/demo-data.ts.

Needs: reportlab, pillow, openpyxl; fonts Carlito and Liberation Sans
(Debian/Ubuntu: fonts-crosextra-carlito, fonts-liberation).
"""

from pathlib import Path
import textwrap

from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from PIL import Image, ImageDraw, ImageFont
from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import Table, TableStyle

OUT = Path(__file__).resolve().parent.parent / "public" / "samples"
OUT.mkdir(parents=True, exist_ok=True)

CARLITO = "/usr/share/fonts/truetype/crosextra/Carlito-Regular.ttf"
CARLITO_BOLD = "/usr/share/fonts/truetype/crosextra/Carlito-Bold.ttf"
SANS = "/usr/share/fonts/truetype/liberation/LiberationSans-Regular.ttf"
SANS_BOLD = "/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf"
SYMBOLS = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"


# --------------------------------------------------------------------------
# A: Shree Balaji Packaging, formal PDF quotation
# --------------------------------------------------------------------------
def quote_a() -> None:
    from reportlab.pdfgen import canvas

    pdfmetrics.registerFont(TTFont("Carlito", CARLITO))
    pdfmetrics.registerFont(TTFont("Carlito-Bold", CARLITO_BOLD))
    path = OUT / "quote-A-shree-balaji.pdf"
    c = canvas.Canvas(str(path), pagesize=A4)
    c.setTitle("Quotation SBP/Q/26-27/2611 - Shree Balaji Packaging")
    c.setAuthor("Shree Balaji Packaging (sample)")
    w, h = A4
    maroon = colors.HexColor("#7A1F2B")

    # Letterhead
    c.setFillColor(maroon)
    c.rect(0, h - 8 * mm, w, 8 * mm, stroke=0, fill=1)
    c.setFont("Carlito-Bold", 24)
    c.drawString(20 * mm, h - 25 * mm, "SHREE BALAJI PACKAGING")
    c.setFillColor(colors.HexColor("#333333"))
    c.setFont("Carlito", 10.5)
    c.drawString(20 * mm, h - 31 * mm, "Manufacturers of Corrugated Boxes & Packaging Material")
    c.drawString(20 * mm, h - 36 * mm, "Plot 118, Sector 24, Faridabad, Haryana 121005")
    c.drawString(20 * mm, h - 41 * mm, "Ph: +91 98XXX 41207   |   sales@shreebalaji-pack.example")
    c.setFont("Carlito-Bold", 10.5)
    c.drawRightString(w - 20 * mm, h - 25 * mm, "GSTIN: 06AAPFS4721K1ZU")
    c.setStrokeColor(maroon)
    c.setLineWidth(1.2)
    c.line(20 * mm, h - 45 * mm, w - 20 * mm, h - 45 * mm)

    # Title and refs
    c.setFillColor(colors.black)
    c.setFont("Carlito-Bold", 15)
    c.drawCentredString(w / 2, h - 55 * mm, "QUOTATION")
    c.setFont("Carlito", 11)
    c.drawString(20 * mm, h - 64 * mm, "Ref: SBP/Q/26-27/2611")
    c.drawRightString(w - 20 * mm, h - 64 * mm, "Date: 14-10-2026")
    y = h - 74 * mm
    for line in ["To,", "The Purchase Manager", "Ghar Goods Pvt. Ltd.", "Udyog Vihar Phase IV, Gurugram, Haryana"]:
        c.drawString(20 * mm, y, line)
        y -= 5.2 * mm
    y -= 3 * mm
    c.drawString(20 * mm, y, "Dear Sir/Madam,")
    y -= 6 * mm
    c.drawString(20 * mm, y, "With reference to your enquiry, we are pleased to quote our best rates as under:")

    # Item table
    data = [
        ["S.No.", "Description", "HSN", "Qty (approx.)", "Rate (₹)", "Per"],
        ["1", "3-ply corrugated box 12x10x8 inch,\nbrown kraft, 150 GSM", "48191010", "5,000", "18.00", "Box"],
    ]
    t = Table(data, colWidths=[14 * mm, 70 * mm, 22 * mm, 24 * mm, 20 * mm, 16 * mm])
    t.setStyle(
        TableStyle(
            [
                ("FONT", (0, 0), (-1, 0), "Carlito-Bold", 10.5),
                ("FONT", (0, 1), (-1, -1), "Carlito", 10.5),
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#F1E6E8")),
                ("GRID", (0, 0), (-1, -1), 0.6, colors.HexColor("#999999")),
                ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ("ALIGN", (3, 0), (4, -1), "RIGHT"),
                ("ALIGN", (0, 0), (0, -1), "CENTER"),
                ("TOPPADDING", (0, 0), (-1, -1), 5),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
            ]
        )
    )
    tw, th = t.wrapOn(c, w, h)
    y -= 6 * mm + th
    t.drawOn(c, 20 * mm, y)

    # Terms
    y -= 11 * mm
    c.setFont("Carlito-Bold", 11)
    c.drawString(20 * mm, y, "Terms & Conditions:")
    c.setFont("Carlito", 10.5)
    terms = [
        "1. GST @ 18% extra as applicable.",
        "2. Freight ₹6,000 extra (Gurugram delivery).",
        "3. Minimum order 2,000 boxes.",
        "4. Delivery within 10 days of PO.",
        "5. Valid till 31-03-2027.",
        "6. Payment: 50% advance with PO, balance against delivery.",
        "7. Printing, if required, will be charged extra on actuals.",
    ]
    for line in terms:
        y -= 5.6 * mm
        c.drawString(22 * mm, y, line)

    y -= 12 * mm
    c.drawString(20 * mm, y, "We look forward to your valued order.")
    y -= 16 * mm
    c.setFont("Carlito-Bold", 11)
    c.drawRightString(w - 20 * mm, y, "For SHREE BALAJI PACKAGING")
    y -= 14 * mm
    c.setFont("Carlito", 10.5)
    c.drawRightString(w - 20 * mm, y, "Authorised Signatory")

    c.setFont("Carlito", 8.5)
    c.setFillColor(colors.HexColor("#888888"))
    c.drawCentredString(w / 2, 12 * mm, "Sample document for the AsliRate demo. Fictional business and GSTIN.")
    c.showPage()
    c.save()
    print("wrote", path)


# --------------------------------------------------------------------------
# B: Om Corrugators, WhatsApp chat screenshot
# --------------------------------------------------------------------------
def quote_b() -> None:
    W, H = 900, 1560
    img = Image.new("RGB", (W, H), "#ECE5DD")
    d = ImageDraw.Draw(img)
    f = lambda size, bold=False: ImageFont.truetype(SANS_BOLD if bold else SANS, size)

    # Subtle wallpaper dots
    for yy in range(200, H, 46):
        for xx in range((yy // 46 % 2) * 23, W, 46):
            d.ellipse((xx, yy, xx + 3, yy + 3), fill="#E2D9CF")

    # Status bar + header
    d.rectangle((0, 0, W, 50), fill="#054D44")
    d.text((28, 12), "11:06", font=f(24, True), fill="white")
    d.text((W - 120, 12), "4G  82%", font=f(22), fill="white")
    d.rectangle((0, 50, W, 160), fill="#075E54")
    d.text((26, 80), "←", font=ImageFont.truetype(SYMBOLS, 40), fill="white")
    d.ellipse((78, 70, 148, 140), fill="#C9D3D1")
    d.text((99, 84), "OC", font=f(26, True), fill="#075E54")
    d.text((168, 72), "Om Corrugators", font=f(32, True), fill="white")
    d.text((168, 114), "online", font=f(22), fill="#D5ECE8")

    y = 190

    def chip(text: str):
        nonlocal y
        font = f(22)
        tw = d.textlength(text, font=font)
        x0 = (W - tw) / 2 - 18
        d.rounded_rectangle((x0, y, x0 + tw + 36, y + 42), radius=12, fill="#E1F2FB")
        d.text((x0 + 18, y + 9), text, font=font, fill="#4A5A63")
        y += 66

    def bubble(text: str, time: str, outgoing: bool):
        nonlocal y
        font = f(29)
        lines = []
        for para in text.split("\n"):
            lines += textwrap.wrap(para, width=34) or [""]
        line_h = 40
        text_w = max(d.textlength(l, font=font) for l in lines)
        time_font = f(19)
        tick_font = ImageFont.truetype(SYMBOLS, 19)
        tw = d.textlength(time, font=time_font) + (34 if outgoing else 0)
        bw = max(text_w, tw) + 44
        bh = len(lines) * line_h + 52
        x0 = W - bw - 26 if outgoing else 26
        fill = "#DCF8C6" if outgoing else "#FFFFFF"
        d.rounded_rectangle((x0, y, x0 + bw, y + bh), radius=16, fill=fill)
        for i, l in enumerate(lines):
            d.text((x0 + 22, y + 14 + i * line_h), l, font=font, fill="#111B21")
        d.text((x0 + bw - tw - 18, y + bh - 30), time, font=time_font, fill="#667781")
        if outgoing:
            d.text((x0 + bw - 44, y + bh - 31), "✓✓", font=tick_font, fill="#34B7F1")
        y += bh + 14

    chip("15 October 2026")
    bubble("Hi, need rate for 3 ply box 12x10x8, approx 5000 pcs. Delivery Gurugram", "10:42", True)
    bubble("Ji sir", "10:58", False)
    bubble("12x10x8 3 ply brown — 19.50 per box all inclusive (GST 18% + delivery)", "11:01", False)
    bubble("ready in 1 week", "11:01", False)
    bubble("GST no. 07BHKPR2219M1ZX", "11:02", False)
    bubble("Ok thanks, will confirm by today", "11:05", True)
    bubble("Sure sir", "11:06", False)

    # Input bar
    d.rectangle((0, H - 96, W, H), fill="#ECE5DD")
    d.rounded_rectangle((16, H - 84, W - 110, H - 16), radius=34, fill="white")
    d.text((50, H - 64), "Message", font=f(28), fill="#8696A0")
    d.ellipse((W - 92, H - 86, W - 18, H - 12), fill="#00A884")
    cx, cy = W - 55, H - 49
    d.polygon([(cx - 13, cy - 15), (cx + 17, cy), (cx - 13, cy + 15), (cx - 8, cy)], fill="white")

    d.text((26, H - 128), "Sample screenshot for the AsliRate demo. Fictional business.", font=f(18), fill="#9AA4A8")
    path = OUT / "quote-B-om-corrugators-whatsapp.png"
    img.save(path, optimize=True)
    print("wrote", path)


# --------------------------------------------------------------------------
# C: Kanha Paper Products, Excel rate list
# --------------------------------------------------------------------------
def quote_c() -> None:
    wb = Workbook()
    ws = wb.active
    ws.title = "Rate List Oct 26"
    bold = Font(name="Calibri", bold=True, size=11)
    thin = Side(style="thin", color="999999")
    box = Border(left=thin, right=thin, top=thin, bottom=thin)

    ws["A1"] = "Kanha Paper Products — Rate List"
    ws["A1"].font = Font(name="Calibri", bold=True, size=16, color="1F4E79")
    ws["A2"] = "B-42, Sector 63, Noida, Uttar Pradesh 201301   |   Ph: 0120-4XXXX18"
    ws["A3"] = "Regd."
    ws["B3"] = "GSTIN 09AAJCK8834D1Z9"
    ws["B3"].font = bold
    ws["E3"] = "Date: 16-10-2026"

    headers = ["S.No", "Item", "Size (inch)", "Ply", "Rate (₹/pc)", "MOQ (pcs)"]
    for col, text in enumerate(headers, start=1):
        cell = ws.cell(row=5, column=col, value=text)
        cell.font = Font(name="Calibri", bold=True, color="FFFFFF")
        cell.fill = PatternFill("solid", fgColor="1F4E79")
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = box

    rows = [
        (1, "Corrugated box, natural kraft", "12x10x8", "3 Ply", 17.20, 10000),
        (2, "Corrugated box, natural kraft", "14x12x10", "3 Ply", 22.80, 10000),
        (3, "Corrugated box, natural kraft", "12x10x8", "5 Ply", 26.50, 5000),
        (4, "Corrugated box, natural kraft", "18x14x12", "5 Ply", 41.00, 5000),
    ]
    for r, row in enumerate(rows, start=6):
        for col, value in enumerate(row, start=1):
            cell = ws.cell(row=r, column=col, value=value)
            cell.border = box
            cell.font = Font(name="Calibri", size=11, bold=(r == 6 and col in (5, 6)))
        ws.cell(row=r, column=5).number_format = '"₹"#,##0.00'
        ws.cell(row=r, column=6).number_format = "#,##0"
        ws.cell(row=r, column=1).alignment = Alignment(horizontal="center")
    ws["A6"].fill = ws["B6"].fill = ws["C6"].fill = ws["D6"].fill = ws["E6"].fill = ws["F6"].fill = PatternFill(
        "solid", fgColor="FFF2CC"
    )

    ws["A11"] = "Terms:"
    ws["A11"].font = bold
    terms = [
        "GST 18% extra",
        "Freight to Gurugram ₹9,000",
        "Dispatch in 2 weeks",
        "Payment 30 days from invoice",
        "Rates valid up to 31 Mar 2027",
    ]
    for i, t in enumerate(terms, start=12):
        ws.cell(row=i, column=1, value="•")
        ws.cell(row=i, column=2, value=t)

    ws["A18"] = "Sample spreadsheet for the AsliRate demo. Fictional business and GSTIN."
    ws["A18"].font = Font(name="Calibri", italic=True, size=9, color="888888")

    for col, width in zip("ABCDEF", [7, 32, 13, 8, 13, 12]):
        ws.column_dimensions[col].width = width
    ws.freeze_panes = "A6"
    wb.properties.creator = "Kanha Paper Products (sample)"

    path = OUT / "quote-C-kanha-rate-list.xlsx"
    wb.save(path)
    print("wrote", path)


if __name__ == "__main__":
    quote_a()
    quote_b()
    quote_c()
