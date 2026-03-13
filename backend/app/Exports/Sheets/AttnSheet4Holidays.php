<?php

namespace App\Exports\Sheets;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class AttnSheet4Holidays implements FromArray, WithTitle, WithHeadings, WithStyles
{
    public function __construct(private array $report) {}

    public function title(): string { return 'Attn Sheet 4'; }

    public function headings(): array
    {
        return ['Date','Title','Type','Optional'];
    }

    public function array(): array
    {
        $holidays = array_values($this->report['holidays'] ?? []);
        usort($holidays, fn($a,$b) => strcmp($a['date'], $b['date']));

        return array_map(function ($h) {
            return [
                $h['date'],
                $h['title'],
                $h['type'],
                !empty($h['is_optional']) ? 'Yes' : 'No',
            ];
        }, $holidays);
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->freezePane('A2');
        $sheet->getStyle('A1:D1')->getFont()->setBold(true);
        $sheet->getColumnDimension('A')->setWidth(12);
        $sheet->getColumnDimension('B')->setWidth(40);
        $sheet->getColumnDimension('C')->setWidth(12);
        $sheet->getColumnDimension('D')->setWidth(10);

        return [];
    }
}