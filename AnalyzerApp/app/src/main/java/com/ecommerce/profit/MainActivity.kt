package com.ecommerce.profit

import android.net.Uri
import android.os.Bundle
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import com.github.doyaaaaaken.kotlincsv.dsl.csvReader
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.xmlpull.v1.XmlPullParser
import org.xmlpull.v1.XmlPullParserFactory
import java.io.InputStream
import java.text.NumberFormat
import java.util.Locale
import java.util.zip.ZipInputStream

class MainActivity : ComponentActivity() {

    private var selectedFileUri by mutableStateOf<Uri?>(null)
    private var selectedFileName by mutableStateOf<String?>(null)

    private val filePickerLauncher =
        registerForActivityResult(ActivityResultContracts.GetContent()) { uri: Uri? ->
            uri?.let {
                selectedFileUri = it
                // Try to get display name
                selectedFileName = try {
                    val cursor = contentResolver.query(it, null, null, null, null)
                    cursor?.use { c ->
                        if (c.moveToFirst()) {
                            val idx = c.getColumnIndex(android.provider.OpenableColumns.DISPLAY_NAME)
                            if (idx >= 0) c.getString(idx) else null
                        } else null
                    }
                } catch (_: Exception) { null }
                Toast.makeText(this, "✓ File berhasil dimuat", Toast.LENGTH_SHORT).show()
            }
        }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme {
                Surface(
                    modifier = Modifier.fillMaxSize(),
                    color = MaterialTheme.colorScheme.background
                ) {
                    ProfitAnalyzerApp()
                }
            }
        }
    }

    @OptIn(ExperimentalMaterial3Api::class)
    @Composable
    fun ProfitAnalyzerApp() {
        val coroutineScope = rememberCoroutineScope()
        var adminFeeInput by remember { mutableStateOf("") }
        var cogsInput by remember { mutableStateOf("") }

        var adSpend by remember { mutableDoubleStateOf(0.0) }
        var grossRevenue by remember { mutableDoubleStateOf(0.0) }
        var totalOrders by remember { mutableDoubleStateOf(0.0) }

        var showResults by remember { mutableStateOf(false) }
        var isCalculating by remember { mutableStateOf(false) }

        val localeID = Locale("id", "ID")
        val numberFormat = NumberFormat.getCurrencyInstance(localeID)
        numberFormat.maximumFractionDigits = 0

        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(16.dp)
                .verticalScroll(rememberScrollState())
        ) {
            // Header
            Text(
                "E-Commerce Profit Analyzer",
                fontSize = 22.sp,
                fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(bottom = 4.dp)
            )
            Text(
                "Hitung profit bersih dari laporan TikTok Shop & Tokopedia",
                fontSize = 13.sp,
                color = Color.Gray,
                modifier = Modifier.padding(bottom = 16.dp)
            )

            // Step 1: Import
            Card(
                modifier = Modifier.fillMaxWidth(),
                colors = CardDefaults.cardColors(
                    containerColor = if (selectedFileUri != null)
                        Color(0xFFE8F5E9) else MaterialTheme.colorScheme.surfaceVariant
                )
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("① Import Data", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                    Spacer(modifier = Modifier.height(8.dp))
                    Button(
                        onClick = { filePickerLauncher.launch("*/*") },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text(
                            if (selectedFileUri == null) "Pilih File CSV / Excel"
                            else "✓ ${selectedFileName ?: "File Terpilih"}"
                        )
                    }
                    if (selectedFileUri != null) {
                        Text(
                            "Tap lagi untuk mengganti file",
                            fontSize = 11.sp,
                            color = Color.Gray,
                            modifier = Modifier.padding(top = 4.dp)
                        )
                    }
                }
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Step 2: Input variables
            Card(modifier = Modifier.fillMaxWidth()) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Text("② Masukkan Variabel", fontWeight = FontWeight.SemiBold, fontSize = 14.sp)
                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = adminFeeInput,
                        onValueChange = { adminFeeInput = it },
                        label = { Text("Platform Admin Fee (%)") },
                        placeholder = { Text("contoh: 6.5") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Decimal),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )

                    Spacer(modifier = Modifier.height(12.dp))

                    OutlinedTextField(
                        value = cogsInput,
                        onValueChange = { cogsInput = it },
                        label = { Text("COGS / Modal per Item (IDR)") },
                        placeholder = { Text("contoh: 50000") },
                        keyboardOptions = KeyboardOptions(keyboardType = KeyboardType.Number),
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }

            Spacer(modifier = Modifier.height(20.dp))

            // Step 3: Calculate
            Button(
                onClick = {
                    if (selectedFileUri == null) {
                        Toast.makeText(this@MainActivity, "Silakan import file terlebih dahulu", Toast.LENGTH_SHORT).show()
                        return@Button
                    }
                    val adminFee = adminFeeInput.toDoubleOrNull()
                    val cogs = cogsInput.toDoubleOrNull()
                    if (adminFee == null || cogs == null) {
                        Toast.makeText(this@MainActivity, "Masukkan angka yang valid", Toast.LENGTH_SHORT).show()
                        return@Button
                    }

                    isCalculating = true
                    showResults = false

                    coroutineScope.launch {
                        try {
                            val result = processFile(selectedFileUri!!)
                            adSpend = result.adSpend
                            grossRevenue = result.grossRevenue
                            totalOrders = result.totalOrders
                            showResults = true
                        } catch (e: Exception) {
                            withContext(Dispatchers.Main) {
                                Toast.makeText(
                                    this@MainActivity,
                                    e.message ?: "Error memproses file",
                                    Toast.LENGTH_LONG
                                ).show()
                            }
                        } finally {
                            isCalculating = false
                        }
                    }
                },
                modifier = Modifier
                    .fillMaxWidth()
                    .height(50.dp),
                enabled = !isCalculating
            ) {
                if (isCalculating) {
                    CircularProgressIndicator(
                        modifier = Modifier.size(20.dp),
                        color = Color.White,
                        strokeWidth = 2.dp
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Menghitung...")
                } else {
                    Text("Hitung Profit", fontSize = 16.sp)
                }
            }

            // Step 4: Results
            if (showResults) {
                Spacer(modifier = Modifier.height(24.dp))

                val adminFee = adminFeeInput.toDoubleOrNull() ?: 0.0
                val cogs = cogsInput.toDoubleOrNull() ?: 0.0

                val adminFeeDeduction = grossRevenue * (adminFee / 100.0)
                val cogsDeduction = totalOrders * cogs
                val netProfit = grossRevenue - adSpend - adminFeeDeduction - cogsDeduction
                val profitColor = if (netProfit >= 0) Color(0xFF2E7D32) else Color(0xFFC62828)

                Card(
                    modifier = Modifier.fillMaxWidth(),
                    elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            "Hasil Kalkulasi",
                            fontSize = 16.sp,
                            fontWeight = FontWeight.Bold,
                            modifier = Modifier.padding(bottom = 12.dp)
                        )

                        ResultRow("Total Pendapatan Kotor", numberFormat.format(grossRevenue))
                        ResultRow("Total Biaya Iklan", "- ${numberFormat.format(adSpend)}")
                        ResultRow("Total Pesanan", "${totalOrders.toInt()} pesanan")
                        ResultRow(
                            "Potongan Admin Fee (${adminFee}%)",
                            "- ${numberFormat.format(adminFeeDeduction)}"
                        )
                        ResultRow(
                            "Potongan Modal (COGS)",
                            "- ${numberFormat.format(cogsDeduction)}"
                        )

                        Divider(modifier = Modifier.padding(vertical = 12.dp))

                        // Net Profit highlight
                        Card(
                            modifier = Modifier.fillMaxWidth(),
                            colors = CardDefaults.cardColors(
                                containerColor = if (netProfit >= 0) Color(0xFFE8F5E9) else Color(0xFFFFEBEE)
                            )
                        ) {
                            Column(
                                modifier = Modifier
                                    .fillMaxWidth()
                                    .padding(12.dp),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Text(
                                    if (netProfit >= 0) "UNTUNG ✓" else "RUGI ✗",
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 13.sp,
                                    color = profitColor
                                )
                                Spacer(modifier = Modifier.height(4.dp))
                                Text(
                                    numberFormat.format(netProfit),
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 24.sp,
                                    color = profitColor
                                )
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(32.dp))
            }
        }
    }

    @Composable
    fun ResultRow(label: String, value: String) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 4.dp),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text(label, color = Color.Gray, fontSize = 13.sp, modifier = Modifier.weight(1f))
            Text(value, fontWeight = FontWeight.Medium, fontSize = 13.sp)
        }
    }

    // ─── Data Processing ─────────────────────────────────────

    data class ParseResult(
        val adSpend: Double,
        val grossRevenue: Double,
        val totalOrders: Double
    )

    private suspend fun processFile(uri: Uri): ParseResult = withContext(Dispatchers.IO) {
        val contentResolver = applicationContext.contentResolver
        val type = contentResolver.getType(uri) ?: ""
        val name = selectedFileName ?: uri.path ?: ""

        val isExcel = type.contains("excel") ||
                type.contains("spreadsheet") ||
                type.contains("openxmlformats") ||
                name.endsWith(".xlsx", ignoreCase = true) ||
                name.endsWith(".xls", ignoreCase = true)

        contentResolver.openInputStream(uri)?.use { inputStream ->
            if (isExcel) {
                parseXlsx(inputStream)
            } else {
                parseCsv(inputStream)
            }
        } ?: throw Exception("Gagal membuka file")
    }

    // ─── CSV Parser ──────────────────────────────────────────

    private fun parseCsv(inputStream: InputStream): ParseResult {
        val rows = csvReader().readAll(inputStream)
        if (rows.isEmpty()) throw Exception("File kosong")

        val header = rows[0].map { it.trim() }
        val adSpendIdx = header.indexOf("Biaya")
        val grossRevenueIdx = header.indexOf("Pendapatan kotor")
        val ordersIdx = header.indexOf("Pesanan")

        if (adSpendIdx == -1 || grossRevenueIdx == -1 || ordersIdx == -1) {
            throw Exception("Invalid file format. Required columns not found.")
        }

        var adSpend = 0.0
        var grossRevenue = 0.0
        var totalOrders = 0.0

        for (i in 1 until rows.size) {
            val row = rows[i]
            if (row.size <= maxOf(adSpendIdx, grossRevenueIdx, ordersIdx)) continue

            adSpend += parseNumber(row[adSpendIdx])
            grossRevenue += parseNumber(row[grossRevenueIdx])
            totalOrders += parseNumber(row[ordersIdx])
        }

        return ParseResult(adSpend, grossRevenue, totalOrders)
    }

    // ─── XLSX Parser (ZIP + XML, no Apache POI needed) ───────

    /**
     * Parses .xlsx files using Android's built-in ZIP and XML APIs.
     * An .xlsx file is a ZIP archive containing XML files:
     * - xl/sharedStrings.xml → contains shared string table
     * - xl/worksheets/sheet1.xml → contains cell data
     */
    private fun parseXlsx(inputStream: InputStream): ParseResult {
        // Step 1: Read ZIP entries into memory
        val entries = mutableMapOf<String, ByteArray>()
        ZipInputStream(inputStream).use { zip ->
            var entry = zip.nextEntry
            while (entry != null) {
                val name = entry.name.lowercase()
                if (name.contains("sharedstrings") || name.contains("sheet1") || name.contains("sheet.xml")) {
                    entries[name] = zip.readBytes()
                }
                zip.closeEntry()
                entry = zip.nextEntry
            }
        }

        // Step 2: Parse shared strings table
        val sharedStrings = mutableListOf<String>()
        val sstEntry = entries.keys.find { it.contains("sharedstrings") }
        if (sstEntry != null) {
            val factory = XmlPullParserFactory.newInstance()
            val parser = factory.newPullParser()
            parser.setInput(entries[sstEntry]!!.inputStream(), "UTF-8")

            var inT = false
            val sb = StringBuilder()
            var eventType = parser.eventType
            while (eventType != XmlPullParser.END_DOCUMENT) {
                when (eventType) {
                    XmlPullParser.START_TAG -> {
                        if (parser.name == "t") {
                            inT = true
                            sb.clear()
                        }
                    }
                    XmlPullParser.TEXT -> {
                        if (inT) sb.append(parser.text)
                    }
                    XmlPullParser.END_TAG -> {
                        if (parser.name == "t") {
                            inT = false
                        } else if (parser.name == "si") {
                            sharedStrings.add(sb.toString())
                            sb.clear()
                        }
                    }
                }
                eventType = parser.next()
            }
        }

        // Step 3: Parse sheet1 data
        val sheetEntry = entries.keys.find { it.contains("sheet1") || it.contains("sheet.xml") }
            ?: throw Exception("Invalid file format. Required columns not found.")

        val factory = XmlPullParserFactory.newInstance()
        val parser = factory.newPullParser()
        parser.setInput(entries[sheetEntry]!!.inputStream(), "UTF-8")

        // Collect all rows: List of maps (colIndex -> cellValue)
        val rows = mutableListOf<MutableMap<Int, String>>()
        var currentRow: MutableMap<Int, String>? = null
        var currentCellRef = ""
        var currentCellType = ""
        var cellValue = ""
        var inV = false

        var eventType = parser.eventType
        while (eventType != XmlPullParser.END_DOCUMENT) {
            when (eventType) {
                XmlPullParser.START_TAG -> {
                    when (parser.name) {
                        "row" -> {
                            currentRow = mutableMapOf()
                        }
                        "c" -> {
                            currentCellRef = parser.getAttributeValue(null, "r") ?: ""
                            currentCellType = parser.getAttributeValue(null, "t") ?: ""
                            cellValue = ""
                        }
                        "v" -> {
                            inV = true
                            cellValue = ""
                        }
                    }
                }
                XmlPullParser.TEXT -> {
                    if (inV) cellValue += parser.text
                }
                XmlPullParser.END_TAG -> {
                    when (parser.name) {
                        "v" -> inV = false
                        "c" -> {
                            val colIndex = cellRefToColIndex(currentCellRef)
                            val resolvedValue = if (currentCellType == "s") {
                                // Shared string reference
                                val idx = cellValue.trim().toIntOrNull()
                                if (idx != null && idx < sharedStrings.size) sharedStrings[idx] else cellValue
                            } else {
                                cellValue
                            }
                            currentRow?.put(colIndex, resolvedValue.trim())
                        }
                        "row" -> {
                            currentRow?.let { rows.add(it) }
                            currentRow = null
                        }
                    }
                }
            }
            eventType = parser.next()
        }

        if (rows.isEmpty()) throw Exception("Excel file kosong")

        // Step 4: Find column indices from header row
        val headerRow = rows[0]
        var adSpendIdx = -1
        var grossRevenueIdx = -1
        var ordersIdx = -1

        for ((colIdx, value) in headerRow) {
            when (value.trim()) {
                "Biaya" -> adSpendIdx = colIdx
                "Pendapatan kotor" -> grossRevenueIdx = colIdx
                "Pesanan" -> ordersIdx = colIdx
            }
        }

        if (adSpendIdx == -1 || grossRevenueIdx == -1 || ordersIdx == -1) {
            throw Exception("Invalid file format. Required columns not found.")
        }

        // Step 5: Sum values
        var adSpend = 0.0
        var grossRevenue = 0.0
        var totalOrders = 0.0

        for (i in 1 until rows.size) {
            val row = rows[i]
            adSpend += parseNumber(row[adSpendIdx] ?: "")
            grossRevenue += parseNumber(row[grossRevenueIdx] ?: "")
            totalOrders += parseNumber(row[ordersIdx] ?: "")
        }

        return ParseResult(adSpend, grossRevenue, totalOrders)
    }

    /**
     * Converts Excel cell reference (e.g. "B3", "AA1") to 0-based column index.
     */
    private fun cellRefToColIndex(ref: String): Int {
        var col = 0
        for (ch in ref) {
            if (ch.isLetter()) {
                col = col * 26 + (ch.uppercaseChar() - 'A' + 1)
            } else break
        }
        return col - 1
    }

    // ─── Number Parser (Indonesian format aware) ─────────────

    /**
     * Parses number strings that may be in Indonesian format.
     * Indonesian numbers use dots as thousands separators and commas as decimal separators.
     * Examples: "1.500.000" → 1500000.0, "1.500.000,50" → 1500000.5, "1500000" → 1500000.0
     */
    private fun parseNumber(str: String): Double {
        val trimmed = str.trim()
        if (trimmed.isEmpty()) return 0.0

        // Remove currency symbols, spaces, and non-numeric chars (like "Rp", "IDR")
        val cleaned = trimmed.replace(Regex("[^0-9.,\\-]"), "")
        if (cleaned.isEmpty()) return 0.0

        val dotCount = cleaned.count { it == '.' }
        val commaCount = cleaned.count { it == ',' }

        val normalized: String = when {
            // Indonesian format: dots as thousands separator, comma as decimal
            // e.g. "1.500.000,50" or "1.500.000"
            dotCount > 1 || (dotCount >= 1 && commaCount == 1) -> {
                cleaned.replace(".", "").replace(",", ".")
            }
            // Only commas, likely thousands separators (e.g. "1,500,000")
            commaCount > 1 -> {
                cleaned.replace(",", "")
            }
            // Single comma, no dots — could be decimal comma (e.g. "1500,50")
            commaCount == 1 && dotCount == 0 -> {
                val afterComma = cleaned.substringAfter(",")
                if (afterComma.length <= 2) {
                    cleaned.replace(",", ".")
                } else {
                    cleaned.replace(",", "")
                }
            }
            // Standard format or plain integer
            else -> cleaned
        }

        return normalized.toDoubleOrNull() ?: 0.0
    }
}
