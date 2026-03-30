import { Request, Response } from 'express';
import Feedback from '../models/Feedback';

/**
 * @desc Submit feedback
 * @route POST /api/feedback
 * @access Private
 */
export const submitFeedback = async (req: Request, res: Response) => {
  try {
    const { type, content, screenshot } = req.body;
    const user = (req as any).user._id;

    if (!content) {
      return res.status(400).json({ message: 'Feedback content is required' });
    }

    const feedback = await Feedback.create({
      user,
      type: type || 'Feedback',
      content,
      screenshot,
    });

    res.status(201).json(feedback);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc Get all feedback for admin
 * @route GET /api/admin/feedback
 * @access Admin/Founder
 */
export const getAllFeedback = async (req: Request, res: Response) => {
  try {
    const feedback = await Feedback.find()
      .populate('user', 'name userid email profilePic')
      .sort({ createdAt: -1 });

    res.json(feedback);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc Update feedback status
 * @route PATCH /api/admin/feedback/:id
 * @access Admin/Founder
 */
export const updateFeedbackStatus = async (req: Request, res: Response) => {
  try {
    const { status } = req.body;
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    feedback.status = status;
    await feedback.save();

    res.json(feedback);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * @desc Delete feedback
 * @route DELETE /api/admin/feedback/:id
 * @access Admin/Founder
 */
export const deleteFeedback = async (req: Request, res: Response) => {
  try {
    const feedback = await Feedback.findById(req.params.id);

    if (!feedback) {
      return res.status(404).json({ message: 'Feedback not found' });
    }

    await feedback.deleteOne();
    res.json({ message: 'Feedback removed' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};
