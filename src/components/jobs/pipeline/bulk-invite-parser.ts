import Papa from "papaparse";
import * as XLSX from "xlsx";

export type ParsedInviteRow = {
	name: string | null;
	email: string;
};

export async function parseInviteFile(file: File): Promise<ParsedInviteRow[]> {
	const extension = file.name.split(".").pop()?.toLowerCase();
	if (extension === "xlsx" || extension === "xls") {
		const buffer = await file.arrayBuffer();
		const workbook = XLSX.read(buffer, { type: "array" });
		const sheet = workbook.Sheets[workbook.SheetNames[0]];
		const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1 });
		return parseTableRows(rows);
	}

	const text = await file.text();
	const parsed = Papa.parse<string[]>(text, {
		header: false,
		skipEmptyLines: true,
	});
	return parseTableRows(parsed.data);
}

function parseTableRows(rows: unknown[][]): ParsedInviteRow[] {
	if (!rows.length) return [];
	const headers = rows[0].map((cell) => String(cell ?? "").trim());
	const emailIndex = headers.findIndex((header) => /email/i.test(header));
	const nameIndex = headers.findIndex((header) => /name/i.test(header));
	const dataRows = emailIndex >= 0 ? rows.slice(1) : rows;
	const fallbackEmailIndex = emailIndex >= 0 ? emailIndex : 1;
	const fallbackNameIndex = nameIndex >= 0 ? nameIndex : 0;

	return dataRows
		.map((row) => {
			const email = String(row[fallbackEmailIndex] ?? row[0] ?? "")
				.trim()
				.toLowerCase();
			const name = String(row[fallbackNameIndex] ?? "").trim() || null;
			return { name, email };
		})
		.filter((row) => row.email.length > 0);
}
