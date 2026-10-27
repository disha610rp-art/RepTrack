import Program from '../models/Program.js';
import User from '../models/User.js';

// @route GET /api/programs
export async function getPrograms(req, res) {
  try {
    const programs = await Program.find({
      $or: [{ userId: null }, { userId: req.user._id }],
    })
      .populate('workouts.exercises.exerciseId')
      .sort({ createdAt: 1 });

    res.json({ success: true, count: programs.length, data: programs });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch programs' });
  }
}

// @route GET /api/programs/:id
export async function getProgramById(req, res) {
  try {
    const program = await Program.findById(req.params.id).populate(
      'workouts.exercises.exerciseId'
    );
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }
    res.json({ success: true, data: program });
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch program' });
  }
}

// @route POST /api/programs
export async function createProgram(req, res) {
  try {
    const { name, description, difficulty, daysPerWeek, workouts } = req.body;
    if (!name || !workouts || workouts.length === 0) {
      return res.status(400).json({ message: 'Name and at least one workout are required' });
    }

    const program = await Program.create({
      name,
      description: description || '',
      difficulty: difficulty || 'Intermediate',
      daysPerWeek: daysPerWeek || workouts.length,
      author: req.user.name,
      isCustom: true,
      userId: req.user._id,
      workouts,
    });

    const populated = await Program.findById(program._id).populate(
      'workouts.exercises.exerciseId'
    );

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Failed to create program' });
  }
}

// @route PUT /api/programs/:id/set-active
export async function setActiveProgram(req, res) {
  try {
    const program = await Program.findById(req.params.id);
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    await User.findByIdAndUpdate(req.user._id, { activeProgram: program._id });
    res.json({ success: true, activeProgramId: program._id });
  } catch (error) {
    res.status(500).json({ message: 'Failed to set active program' });
  }
}

// @route DELETE /api/programs/:id
export async function deleteProgram(req, res) {
  try {
    const program = await Program.findById(req.params.id);
    if (!program) {
      return res.status(404).json({ message: 'Program not found' });
    }

    if (!program.isCustom || program.userId?.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Cannot delete default programs' });
    }

    await program.deleteOne();
    res.json({ success: true, message: 'Program deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete program' });
  }
}
