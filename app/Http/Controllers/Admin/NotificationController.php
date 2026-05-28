<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $notifications = $request->user()
            ->notifications()
            ->latest()
            ->limit(30)
            ->get()
            ->map(fn ($n) => [
                'id'         => $n->id,
                'data'       => $n->data,
                'created_at' => $n->created_at->toISOString(),
                'read_at'    => $n->read_at?->toISOString(),
            ]);

        return response()->json($notifications);
    }

    public function unreadCount(Request $request): JsonResponse
    {
        return response()->json(['count' => $request->user()->unreadNotifications()->count()]);
    }

    public function markRead(Request $request): JsonResponse
    {
        $request->user()->unreadNotifications->markAsRead();

        return response()->json(['ok' => true]);
    }
}
