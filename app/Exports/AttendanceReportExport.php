<?php

namespace App\Exports;

use App\Exports\Sheets\AttnSheet1Summary;
use App\Exports\Sheets\AttnSheet2Daily;
use App\Exports\Sheets\AttnSheet3Leaves;
use App\Exports\Sheets\AttnSheet4Holidays;
use App\Exports\Support\AttendanceReportBuilder;
use Maatwebsite\Excel\Concerns\WithMultipleSheets;

class AttendanceReportExport implements WithMultipleSheets
{
    public function __construct(public $user, public array $params) {}

    public function sheets(): array
    {
        $report = (new AttendanceReportBuilder())->build($this->user, $this->params);

        return [
            new AttnSheet1Summary($report),
            new AttnSheet2Daily($report),
            new AttnSheet3Leaves($report),
            new AttnSheet4Holidays($report),
        ];
    }
}
