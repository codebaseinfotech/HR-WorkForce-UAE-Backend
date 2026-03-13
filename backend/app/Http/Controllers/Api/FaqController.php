<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Faq;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class FaqController extends Controller
{
    /**
     *  APP: FAQs list (Accordion)
     * GET /api/v1/faqs?company_id=2
     * - If login user has company_id => same company FAQs + global FAQs
     * - If company_id param passed => that company FAQs + global FAQs
     */
    public function index(Request $request)
    {
        $authUser = Auth::user();
        $companyId = $authUser->company_id ?? $request->company_id;

        $request->validate([
            'company_id' => 'nullable|exists:companies,id',
            'search' => 'nullable|string|max:255',
        ]);

        $search = $request->get('search');

        $faqs = Faq::query()
            ->where('is_active', 1)
            ->when($companyId, function ($q) use ($companyId) {
                $q->where(function ($qq) use ($companyId) {
                    $qq->whereNull('company_id')
                        ->orWhere('company_id', $companyId);
                });
            }, function ($q) {
                // if companyId not available => only global
                $q->whereNull('company_id');
            })
            ->when($search, function ($q) use ($search) {
                $q->where(function ($qq) use ($search) {
                    $qq->where('question', 'like', "%{$search}%")
                        ->orWhere('answer', 'like', "%{$search}%");
                });
            })
            ->orderBy('sort_order')
            ->latest('id')
            ->get(['id', 'company_id', 'question', 'answer', 'is_active', 'sort_order', 'created_at']);

        return response()->json([
            'success' => true,
            'company_id' => $companyId,
            'count' => $faqs->count(),
            'data' => $faqs,
        ]);
    }

    /**
     *  ADMIN: List (with filters)
     * GET /api/v1/admin/faqs?company_id=2&is_active=1&search=check
     */
    public function adminIndex(Request $request)
    {
        $request->validate([
            'company_id' => 'nullable|exists:companies,id',
            'is_active' => 'nullable|in:0,1',
            'search' => 'nullable|string|max:255',
            'per_page' => 'nullable|integer|min:1|max:200',
        ]);

        $companyId = $request->get('company_id');
        $isActive = $request->get('is_active');
        $search = $request->get('search');
        $perPage = (int) $request->get('per_page', 20);

        $query = Faq::query()
            ->when(! is_null($companyId), fn ($q) => $q->where('company_id', $companyId))
            ->when(! is_null($isActive), fn ($q) => $q->where('is_active', (int) $isActive))
            ->when($search, function ($q) use ($search) {
                $q->where(function ($qq) use ($search) {
                    $qq->where('question', 'like', "%{$search}%")
                        ->orWhere('answer', 'like', "%{$search}%");
                });
            })
            ->orderBy('sort_order')
            ->latest('id');

        return response()->json([
            'success' => true,
            'data' => $query->paginate($perPage),
        ]);
    }

    /**
     *  ADMIN: Add/Update in ONE API
     * POST /api/v1/admin/faqs/add-update
     *
     * Body:
     *  id? (optional for update)
     *  company_id (nullable => global)
     *  question, answer, is_active, sort_order
     */
    public function store(Request $request)
    {
        $data = $request->validate([
            'id' => 'nullable|exists:faqs,id',
            'company_id' => 'nullable|exists:companies,id',
            'question' => 'required|string|max:255',
            'answer' => 'required|string',
            'is_active' => 'nullable|boolean',
            'sort_order' => 'nullable|integer|min:0|max:9999',
        ]);

        $payload = [
            'company_id' => $data['company_id'] ?? null,
            'question' => $data['question'],
            'answer' => $data['answer'],
            'is_active' => array_key_exists('is_active', $data) ? (bool) $data['is_active'] : true,
            'sort_order' => $data['sort_order'] ?? 0,
        ];

        if (! empty($data['id'])) {
            $faq = Faq::findOrFail($data['id']);
            $faq->update($payload);

            return response()->json([
                'success' => true,
                'message' => 'FAQ updated',
                'data' => $faq->fresh(),
            ]);
        }

        $faq = Faq::create($payload);

        return response()->json([
            'success' => true,
            'message' => 'FAQ created',
            'data' => $faq,
        ], 201);
    }

    /**
     *  ADMIN: Show single
     * GET /api/v1/admin/faqs/{id}
     */
    public function show($id)
    {
        $faq = Faq::find($id);

        if (! $faq) {
            return response()->json([
                'success' => false,
                'message' => 'FAQ not found',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $faq,
        ]);
    }

    /**
     *  ADMIN: Delete
     * DELETE /api/v1/admin/faqs/{id}
     */
    public function destroy($id)
    {
        $faq = Faq::find($id);

        if (! $faq) {
            return response()->json([
                'success' => false,
                'message' => 'FAQ not found',
            ], 404);
        }

        $faq->delete();

        return response()->json([
            'success' => true,
            'message' => 'FAQ deleted',
        ]);
    }

    /**
     *  ADMIN: Toggle Active
     * POST /api/v1/admin/faqs/{id}/toggle
     */
    public function toggle($id)
    {
        $faq = Faq::find($id);

        if (! $faq) {
            return response()->json([
                'success' => false,
                'message' => 'FAQ not found',
            ], 404);
        }

        $faq->is_active = ! $faq->is_active;
        $faq->save();

        return response()->json([
            'success' => true,
            'message' => 'FAQ status updated',
            'data' => $faq->fresh(),
        ]);
    }
}
