from flask import Blueprint, jsonify

from models import Exercise

exercises_bp = Blueprint('exercises', __name__)


@exercises_bp.route('/exercises', methods=['GET'])
def get_exercises():
    exercises = Exercise.query.filter_by(is_custom=False, is_archived=False)

    exercises_data = [
        {
            'uuid': e.uuid,
            'name': e.name,
            'category': e.category,
            'muscle_group': e.muscle_group,
            'stat_type': e.stat_type,
            'xp_multiplier': e.xp_multiplier
        }
        for e in exercises
    ]
    return jsonify({
        'success': True,
        'exercises': exercises_data,
        'total': len(exercises_data)
    }), 200
