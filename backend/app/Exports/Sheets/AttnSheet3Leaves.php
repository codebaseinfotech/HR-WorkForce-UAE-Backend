<?php

namespace App\Exports\Sheets;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class AttnSheet3Leaves implements FromArray, WithTitle, WithHeadings, WithStyles
{
    public function __construct(private array $report) {}

    public function title(): string { return 'Attn Sheet 3'; }

    public function headings(): array
    {
        return ['From','To','Days','Status','Reason'];
    }

    public function array(): array
    {
        return array_map(function ($l) {
            return [
                $l['from_date'], $l['to_date'], $l['days'], $l['status'], $l['reason'],
            ];
        }, $this->report['leaves'] ?? []);
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->freezePane('A2');
        $sheet->getStyle('A1:E1')->getFont()->setBold(true);
        $sheet->getColumnDimension('A')->setWidth(12);
        $sheet->getColumnDimension('B')->setWidth(12);
        $sheet->getColumnDimension('E')->setWidth(45);

        return [];
    }
}