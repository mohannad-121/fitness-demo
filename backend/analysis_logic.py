"""

This module provides testable analysis functions for:
1) Weekly progress rate
2) Goal achievement percentage
3) Time-to-goal estimation
4) Calorie adjustment engine
5) Goal tracking state
"""

from __future__ import annotations

from typing import Any, Dict, Iterable, Mapping, Optional, Sequence


DEFAULT_TARGETS = {
    "weight_loss": -0.5,
    "fat_loss": -0.5,
    "weight_gain": 0.25,
    "muscle_gain": 0.25,
}


# Safely parse mixed input (str/int/None) to float with fallback.
# تحويل الإدخال المختلط (نص/رقم/قيمة فارغة) إلى رقم عشري بشكل آمن مع قيمة بديلة.
def _to_float(value: Any, fallback: float = 0.0) -> float:
    """Convert mixed numeric input to float safely."""
    try:
        return float(value)
    except (TypeError, ValueError):
        return fallback


# Constrain any numeric value to a closed range.
# حصر أي قيمة رقمية داخل نطاق محدد.
def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


# Aggregate weekly training load across workouts and exercises.
# تجميع الحمل التدريبي الأسبوعي عبر جميع التمارين والجلسات.
def _compute_training_volume(workouts: Iterable[Mapping[str, Any]]) -> float:
    """Compute total weekly training volume.

    volume = sum(sets * reps * load)
    If load is missing, defaults to 1.0 (bodyweight fallback).
    """
    volume = 0.0
    for workout in workouts:
        for ex in workout.get("exercises", []):
            sets = _to_float(ex.get("sets"), 0.0)
            reps = _to_float(ex.get("reps"), 0.0)
            load = _to_float(ex.get("weight_kg"), 1.0)
            volume += sets * reps * load
    return volume


def weekly_progress_rate(
    current_week: Mapping[str, Any],
    previous_week: Optional[Mapping[str, Any]],
) -> Dict[str, Any]:
    """Calculate weighted weekly progress rate.

    Weighted formula:
    - 70% volume change
    - 30% adherence change
    """
    if not previous_week:
        return {"status": "insufficient_data", "progress_rate_pct": None}

    # Compare workload week-over-week.
    # مقارنة حجم الحمل التدريبي بين هذا الأسبوع والأسبوع السابق.
    current_volume = _compute_training_volume(current_week.get("workouts", []))
    previous_volume = _compute_training_volume(previous_week.get("workouts", []))

    # Convert adherence inputs to percentages while protecting division by zero.
    # تحويل الالتزام إلى نسب مئوية مع حماية من القسمة على صفر.
    current_planned = max(_to_float(current_week.get("planned_days"), 0.0), 1.0)
    current_completed = _to_float(current_week.get("completed_days"), 0.0)
    prev_planned = max(_to_float(previous_week.get("planned_days"), 0.0), 1.0)
    prev_completed = _to_float(previous_week.get("completed_days"), 0.0)

    adherence_current = current_completed / current_planned
    adherence_previous = prev_completed / prev_planned

    # Final weighted score: 70% training volume trend + 30% adherence trend.
    # النتيجة النهائية الموزونة: 70٪ اتجاه حجم التدريب + 30٪ اتجاه الالتزام.
    volume_change_pct = ((current_volume - previous_volume) / max(previous_volume, 1.0)) * 100.0
    adherence_change_pct = (adherence_current - adherence_previous) * 100.0
    progress_rate_pct = (0.7 * volume_change_pct) + (0.3 * adherence_change_pct)

    return {
        "status": "ok",
        "current_volume": round(current_volume, 2),
        "previous_volume": round(previous_volume, 2),
        "volume_change_pct": round(volume_change_pct, 2),
        "adherence_current_pct": round(adherence_current * 100.0, 1),
        "adherence_previous_pct": round(adherence_previous * 100.0, 1),
        "progress_rate_pct": round(progress_rate_pct, 2),
    }


def goal_achievement_percentage(
    goal: Mapping[str, Any],
    profile: Mapping[str, Any],
    monthly_stats: Optional[Mapping[str, Any]] = None,
) -> Optional[float]:
    """Compute goal completion percentage.

    Supports:
    - weight_loss / fat_loss
    - weight_gain
    - strength_gain
    - muscle_gain
    """
    monthly_stats = monthly_stats or {}
    goal_type = str(goal.get("type", "")).strip().lower()

    start_weight = _to_float(profile.get("start_weight") or goal.get("start_weight"))
    current_weight = _to_float(profile.get("current_weight") or goal.get("current_weight"))
    target_weight = _to_float(goal.get("target_weight"))

    # Weight/fat loss progress: how much of planned loss is completed.
    # تقدم خسارة الوزن/الدهون: نسبة ما تم إنجازه من الخسارة المستهدفة.
    if goal_type in {"weight_loss", "fat_loss"}:
        total_needed = start_weight - target_weight
        achieved = start_weight - current_weight
        if total_needed <= 0:
            return None
        return round(_clamp((achieved / total_needed) * 100.0, 0.0, 100.0), 1)

    # Weight gain progress: how much of planned gain is completed.
    # تقدم زيادة الوزن: نسبة ما تم إنجازه من الزيادة المستهدفة.
    if goal_type == "weight_gain":
        total_needed = target_weight - start_weight
        achieved = current_weight - start_weight
        if total_needed <= 0:
            return None
        return round(_clamp((achieved / total_needed) * 100.0, 0.0, 100.0), 1)

    # Strength progress: current strength increase vs target increase.
    # تقدم القوة: الزيادة الحالية في القوة مقارنة بالزيادة المستهدفة.
    if goal_type == "strength_gain":
        current_inc = _to_float(monthly_stats.get("strength_increase_percent"))
        target_inc = _to_float(goal.get("target_strength_increase_percent"))
        if target_inc <= 0:
            return None
        return round(_clamp((current_inc / target_inc) * 100.0, 0.0, 100.0), 1)

    # Muscle gain uses a blended score of strength and weight trend.
    # زيادة العضلات تعتمد على درجة مركبة من اتجاه القوة واتجاه الوزن.
    if goal_type == "muscle_gain":
        strength_component = _to_float(monthly_stats.get("strength_increase_percent"))
        weight_component = _to_float(monthly_stats.get("weight_change_percent"))
        score = (0.7 * strength_component) + (0.3 * weight_component)
        return round(_clamp(score, 0.0, 100.0), 1)

    return None


def time_to_goal_estimation(
    goal: Mapping[str, Any],
    profile: Mapping[str, Any],
    weekly_trend_last_4: Sequence[float],
) -> Dict[str, Any]:
    """Estimate weeks remaining to reach the target.

    `weekly_trend_last_4` should contain the latest weekly change values.
    Example for weight-loss goal: [-0.4, -0.5, -0.3, -0.6]
    """
    if len(weekly_trend_last_4) < 2:
        return {"status": "insufficient_data", "eta_weeks": None}

    goal_type = str(goal.get("type", "")).strip().lower()
    # Smooth noisy weekly values by averaging the last trend window.
    # تنعيم تذبذب القيم الأسبوعية عبر أخذ متوسط نافذة الاتجاه الأخيرة.
    current_rate = sum(_to_float(x) for x in weekly_trend_last_4) / len(weekly_trend_last_4)

    # Choose remaining distance and valid movement direction per goal type.
    # تحديد المسافة المتبقية واتجاه التقدم الصحيح حسب نوع الهدف.
    if goal_type in {"weight_loss", "fat_loss"}:
        remaining = _to_float(profile.get("current_weight")) - _to_float(goal.get("target_weight"))
        useful_rate = abs(current_rate) if current_rate < 0 else 0.0
    elif goal_type in {"weight_gain", "muscle_gain"}:
        remaining = _to_float(goal.get("target_weight")) - _to_float(profile.get("current_weight"))
        useful_rate = current_rate if current_rate > 0 else 0.0
    elif goal_type == "strength_gain":
        remaining = _to_float(goal.get("target_strength_increase_percent")) - _to_float(
            profile.get("current_strength_increase_percent")
        )
        useful_rate = current_rate if current_rate > 0 else 0.0
    else:
        return {"status": "unsupported_goal_type", "eta_weeks": None}

    if remaining <= 0:
        return {"status": "achieved", "eta_weeks": 0}
    if useful_rate <= 0:
        return {"status": "stalled_or_off_track", "eta_weeks": None}

    # Ceiling-style rounding so partial weeks count as a full week.
    # تقريب للأعلى بحيث يُحسب الجزء من الأسبوع كأسبوع كامل.
    eta_weeks = int((remaining / useful_rate) + 0.9999)
    return {"status": "ok", "eta_weeks": eta_weeks, "weekly_rate": round(current_rate, 3)}


# Recommend calorie changes based on current trend vs target trend.
# اقتراح تعديل السعرات بناءً على الاتجاه الحالي مقارنة بالاتجاه المستهدف.
def calorie_adjustment_engine(
    goal_type: str,
    current_daily_calories: float,
    weekly_weight_change_kg: Optional[float],
    target_weekly_change_kg: Optional[float] = None,
    min_calories: int = 1200,
    max_adjustment: int = 250,
) -> Dict[str, Any]:
    """Adjust daily calories based on goal and weekly trend."""
    goal_key = goal_type.strip().lower()
    if weekly_weight_change_kg is None:
        return {
            "status": "insufficient_data",
            "recommended_calories": int(current_daily_calories),
            "adjustment": 0,
            "reason": "weekly_weight_change_kg_missing",
        }

    target = target_weekly_change_kg
    if target is None:
        # Fall back to default target by goal when caller omits target.
        # استخدام الهدف الافتراضي حسب نوع الهدف عند عدم تمرير هدف صريح.
        target = DEFAULT_TARGETS.get(goal_key, 0.0)

    adjustment = 0
    reason = "maintain"

    # Rule set for loss goals: adjust deficit if progress is too slow/fast.
    # قواعد أهداف الخسارة: تعديل العجز إذا كان التقدم أبطأ/أسرع من اللازم.
    if goal_key in {"weight_loss", "fat_loss"}:
        if weekly_weight_change_kg > target + 0.2:
            adjustment = -max_adjustment
            reason = "fat_loss_too_slow_or_weight_gain"
        elif weekly_weight_change_kg > target + 0.1:
            adjustment = -150
            reason = "fat_loss_below_target"
        elif weekly_weight_change_kg < target - 0.3:
            adjustment = 150
            reason = "loss_too_fast_recovery_risk"

    # Rule set for gain goals: adjust surplus if progress is too slow/fast.
    # قواعد أهداف الزيادة: تعديل الفائض إذا كان التقدم أبطأ/أسرع من اللازم.
    elif goal_key in {"weight_gain", "muscle_gain"}:
        if weekly_weight_change_kg < target - 0.2:
            adjustment = 200
            reason = "gain_too_slow"
        elif weekly_weight_change_kg < target - 0.1:
            adjustment = 120
            reason = "gain_below_target"
        elif weekly_weight_change_kg > target + 0.35:
            adjustment = -120
            reason = "gain_too_fast_possible_fat_gain"

    # Apply safety bounds for final recommendation.
    # تطبيق حدود الأمان على التوصية النهائية.
    adjusted = int(current_daily_calories + _clamp(adjustment, -max_adjustment, max_adjustment))
    adjusted = max(int(min_calories), adjusted)

    return {
        "status": "ok",
        "goal_type": goal_key,
        "current_calories": int(current_daily_calories),
        "target_weekly_change_kg": float(target),
        "actual_weekly_change_kg": float(weekly_weight_change_kg),
        "adjustment": int(adjusted - current_daily_calories),
        "recommended_calories": int(adjusted),
        "reason": reason,
    }


def goal_tracking_function(
    goal: Mapping[str, Any],
    profile: Mapping[str, Any],
    monthly_stats: Optional[Mapping[str, Any]],
    weekly_trend_last_4: Sequence[float],
) -> Dict[str, Any]:
    """Return high-level goal state.

    Status options:
    - ACHIEVED
    - IN_PROGRESS
    - STALLED
    """
    # Combine progress percentage with ETA health to classify goal state.
    # دمج نسبة الإنجاز مع حالة التقدير الزمني لتحديد حالة الهدف.
    progress_pct = goal_achievement_percentage(goal, profile, monthly_stats)
    eta = time_to_goal_estimation(goal, profile, weekly_trend_last_4)

    if progress_pct is not None and progress_pct >= 100.0:
        status = "ACHIEVED"
    elif eta.get("status") in {"stalled_or_off_track"}:
        status = "STALLED"
    else:
        status = "IN_PROGRESS"

    return {
        "status": status,
        "goal_type": goal.get("type"),
        "progress_pct": progress_pct,
        "eta_weeks": eta.get("eta_weeks"),
        "eta_status": eta.get("status"),
    }
