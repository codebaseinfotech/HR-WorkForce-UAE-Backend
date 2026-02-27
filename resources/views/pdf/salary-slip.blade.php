<!doctype html>
<html>
<head>
    <meta charset="utf-8">
    <title>Salary Slip</title>
    <style>
        @page { margin: 18px 18px 16px 18px; }

        body { font-family: DejaVu Sans, sans-serif; font-size: 12px; color: #111827; }
        .muted { color: #6b7280; }
        .small { font-size: 11px; }

        /* Theme */
        .purple { color: #7c3aed; }
        .bg-purple { background: #7c3aed; }
        .bg-soft { background: #f6f3ff; } /* soft purple */
        .border { border: 1px solid #e5e7eb; }
        .radius { border-radius: 14px; }
        .shadow { box-shadow: 0 1px 0 rgba(0,0,0,0.05); } /* dompdf-safe light */

        .wrap { border: 1px solid #e5e7eb; border-radius: 16px; overflow: hidden; }
        .topbar { height: 8px; background: #7c3aed; }

        .header { padding: 14px 16px 10px 16px; }
        .header-table { width: 100%; border-collapse: collapse; }
        .header-table td { vertical-align: middle; }
        .logo { width: 54px; height: 54px; border-radius: 12px; background: #f6f3ff; border: 1px solid #ede9fe; text-align:center; }
        .logo img { max-width: 54px; max-height: 54px; border-radius: 12px; }
        .title { font-size: 18px; font-weight: 800; margin: 0; }
        .subtitle { margin-top: 4px; color: #6b7280; }
        .pill { display: inline-block; padding: 4px 10px; font-size: 10px; border-radius: 999px; background: #111827; color: #fff; }
        .pill2 { display: inline-block; padding: 4px 10px; font-size: 10px; border-radius: 999px; background: #f6f3ff; color: #7c3aed; border: 1px solid #ede9fe; font-weight: 700; }

        .meta { text-align: right; }
        .meta .box { display:inline-block; padding: 10px 12px; border: 1px solid #e5e7eb; border-radius: 12px; background:#fff; }
        .meta .row { margin: 2px 0; }
        .meta b { color:#111827; }

        .section { padding: 10px 16px 14px 16px; }
        .grid { width: 100%; border-collapse: collapse; }
        .grid td { vertical-align: top; padding: 6px; }

        .card { border: 1px solid #e5e7eb; border-radius: 14px; padding: 12px; background: #ffffff; }
        .card .h { font-weight: 800; margin-bottom: 8px; }
        .line { height: 1px; background: #e5e7eb; margin: 10px 0; }

        .kv { width:100%; border-collapse: collapse; }
        .kv td { padding: 4px 0; }
        .kv td:first-child { color:#6b7280; width: 38%; }
        .kv td:last-child { font-weight: 700; }

        .table { width: 100%; border-collapse: collapse; margin-top: 10px; border: 1px solid #e5e7eb; border-radius: 14px; overflow: hidden; }
        .table th { padding: 9px 10px; text-align: left; font-size: 11px; background: #111827; color: #fff; }
        .table td { padding: 9px 10px; border-bottom: 1px solid #e5e7eb; }
        .table tr:last-child td { border-bottom: none; }
        .right { text-align: right; }

        .totalRow td { background: #f6f3ff; font-weight: 800; }
        .badge { display:inline-block; padding: 2px 8px; border-radius: 999px; font-size: 10px; background:#f6f3ff; border:1px solid #ede9fe; color:#7c3aed; font-weight:700; }

        .footer { padding: 12px 16px; background: #f9fafb; border-top: 1px solid #e5e7eb; }
        .footer-table { width: 100%; border-collapse: collapse; }
        .footer-table td { vertical-align: bottom; }

        .signBox { text-align: right; }
        .signImg { max-height: 38px; }
        .signLine { margin-top: 6px; height: 1px; background: #9ca3af; width: 160px; display: inline-block; }
        .note { margin-top: 10px; font-size: 10.5px; color: #6b7280; }
    </style>
</head>
<body>

<div class="wrap">
    <div class="topbar"></div>

    <!-- Header -->
    <div class="header">
        <table class="header-table">
            <tr>
                <td style="width:70px;">
                    <div class="logo">
                        @if(!empty($logoBase64))
                            <img src="{{ $logoBase64 }}" alt="Logo">
                        @else
                            <div style="padding-top:16px;" class="purple"><b>LOGO</b></div>
                        @endif
                    </div>
                </td>
                <td>
                    <div class="title">{{ $company->name ?? 'Company' }} <span class="purple">Payslip</span></div>
                    <div class="subtitle">
                        Salary Slip for <b>{{ $period['month_label'] ?? '-' }}</b>
                        &nbsp; • &nbsp; Period: {{ $period['from'] ?? '-' }} to {{ $period['to'] ?? '-' }}
                    </div>
                    <div style="margin-top:6px;">
                        <span class="pill2">{{ strtoupper($salary['salary_type'] ?? 'MONTHLY') }}</span>
                        <span class="badge">{{ $salary['currency'] ?? 'INR' }}</span>
                    </div>
                </td>
                <td class="meta" style="width:220px;">
                    <div class="box">
                        <div class="row"><span class="muted">Payslip No:</span> <b>{{ $salary['payslip_no'] ?? '-' }}</b></div>
                        <div class="row"><span class="muted">Generated:</span> <b>{{ now()->format('d M Y, h:i A') }}</b></div>
                    </div>
                </td>
            </tr>
        </table>
    </div>

    <!-- Body -->
    <div class="section">
        <table class="grid">
            <tr>
                <td style="width:50%;">
                    <div class="card">
                        <div class="h">Employee Details</div>
                        <table class="kv">
                            <tr><td>Name</td><td>{{ trim(($user->first_name ?? '').' '.($user->last_name ?? '')) }}</td></tr>
                            <tr><td>Email</td><td>{{ $user->email ?? '-' }}</td></tr>
                            <tr><td>Phone</td><td>{{ $user->phone ?? '-' }}</td></tr>
                            <tr><td>Employee ID</td><td>{{ $user->employeeId ?? ($user->id ?? '-') }}</td></tr>
                        </table>
                    </div>
                </td>
                <td style="width:50%;">
                    <div class="card">
                        <div class="h">Company Details</div>
                        <table class="kv">
                            <tr><td>Company</td><td>{{ $company->name ?? '-' }}</td></tr>
                            <tr><td>Address</td><td>{{ $company->address ?? '-' }}</td></tr>
                            <tr><td>Email</td><td>{{ $company->email ?? '-' }}</td></tr>
                            <tr><td>Phone</td><td>{{ $company->phone ?? '-' }}</td></tr>
                        </table>
                    </div>
                </td>
            </tr>
        </table>

        <!-- Attendance Summary -->
        <table class="table" style="margin-top:12px;">
            <thead>
            <tr>
                <th>Attendance Summary</th>
                <th class="right">Value</th>
            </tr>
            </thead>
            <tbody>
            <tr><td>Total Days</td><td class="right">{{ $summary['total_days'] ?? 0 }}</td></tr>
            <tr><td>Present Days</td><td class="right">{{ $summary['present_days'] ?? 0 }}</td></tr>
            <tr><td>Leave Days</td><td class="right">{{ $summary['leave_days'] ?? 0 }}</td></tr>
            <tr><td>Absent Days</td><td class="right">{{ $summary['absent_days'] ?? 0 }}</td></tr>
            <tr><td>Total Worked</td><td class="right">{{ $summary['worked'] ?? '00 Hrs 00 Min' }}</td></tr>
            <tr><td>Total Overtime</td><td class="right"><span class="badge">{{ $summary['overtime'] ?? '00 Hrs 00 Min' }}</span></td></tr>
            </tbody>
        </table>

        <!-- Earnings -->
        <table class="table">
            <thead>
            <tr>
                <th>Earnings</th>
                <th class="right">Amount</th>
            </tr>
            </thead>
            <tbody>
            <tr>
                <td>Base Salary</td>
                <td class="right">{{ number_format((float)($salary['base_salary'] ?? 0), 2) }}</td>
            </tr>
            <tr>
                <td>Earned Amount</td>
                <td class="right">{{ number_format((float)($salary['earned_amount'] ?? 0), 2) }}</td>
            </tr>
            <tr>
                <td>Overtime <span class="muted small">(Rate/hr: {{ number_format((float)($salary['overtime_rate_per_hour'] ?? 0), 2) }})</span></td>
                <td class="right">{{ number_format((float)($salary['overtime_amount'] ?? 0), 2) }}</td>
            </tr>

            <tr class="totalRow">
                <td>Gross Payable</td>
                <td class="right">{{ number_format((float)($salary['gross_payable'] ?? 0), 2) }}</td>
            </tr>
            </tbody>
        </table>

        <div class="note">
            Note: This is a system-generated payslip. If you have any queries, please contact HR.
        </div>
    </div>

    <!-- Footer / Signature -->
    <div class="footer">
        <table class="footer-table">
            <tr>
                <td>
                    <div class="small muted">
                        {{ $company->name ?? 'Company' }} • Generated by HRMS System
                    </div>
                </td>
                <td class="signBox">
                    @if(!empty($signBase64))
                        <img class="signImg" src="{{ $signBase64 }}" alt="Signature">
                    @endif
                    <div class="signLine"></div>
                    <div class="small muted">Authorized Signature</div>
                </td>
            </tr>
        </table>
    </div>
</div>

</body>
</html>
