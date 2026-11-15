import { beforeEach, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StudentSubmission } from '../components/assignments/StudentSubmission';
import { ToastProvider } from '../contexts/ToastContext';
import { dateInput, dateToISO, passwordValid } from '../utils/format';
import { setAccessToken } from '../api/httpClient';

const assignment = { _id: 'assignment-id', title: 'React', status: 'published', maxScore: 10, submissionType: 'both', dueAt: null };
const response = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });
beforeEach(() => { setAccessToken('student-token'); vi.stubGlobal('fetch', vi.fn()); });
const renderSubmission = (props = {}) => render(<ToastProvider><StudentSubmission assignment={assignment} course={{ status: 'published' }} enrollment={{ status: 'active' }} {...props} /></ToastProvider>);

it('submits an answer and renders the persisted server response', async () => {
  let stored = null;
  fetch.mockImplementation(async (url, options) => {
    if (options.method === 'POST') { stored = { _id: 'submission-id', textAnswer: JSON.parse(options.body).textAnswer, attachments: [], submittedAt: '2026-11-15T10:00:00Z', status: 'submitted', score: null }; return response({ data: stored }, 201); }
    return stored ? response({ data: stored }) : response({ message: 'Bạn chưa nộp bài.' }, 404);
  });
  const user = userEvent.setup(); renderSubmission();
  await user.type(await screen.findByLabelText('Nội dung bài làm'), 'Bài làm React của tôi.');
  await user.click(screen.getByRole('button', { name: 'Nộp bài' }));
  expect(await screen.findByText('Đã nộp')).toBeInTheDocument();
  expect(screen.getByText('Bài làm React của tôi.')).toHaveClass('answer-content');
  expect(screen.queryByRole('button', { name: 'Nộp bài' })).not.toBeInTheDocument();
});

it('renders a grade of zero and hides all editing controls after grading', async () => {
  fetch.mockResolvedValue(response({ data: { _id: 's', status: 'graded', score: 0, feedback: 'Cần làm lại', textAnswer: 'Bài làm', attachments: [], submittedAt: '2026-11-15T10:00:00Z', gradedAt: '2026-11-15T11:00:00Z' } }));
  renderSubmission();
  expect(await screen.findByText('Cần làm lại')).toBeInTheDocument();
  expect(screen.getByText('0')).toBeInTheDocument();
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Chỉnh sửa bài nộp' })).not.toBeInTheDocument();
});

it('does not offer submission controls for an archived course', async () => {
  fetch.mockResolvedValue(response({ message: 'Chưa nộp' }, 404));
  renderSubmission({ course: { status: 'archived' } });
  expect(await screen.findByText('Khóa học hiện không nhận bài nộp.')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Nộp bài' })).not.toBeInTheDocument();
});

it('shows upload rejection without discarding the typed answer', async () => {
  fetch.mockImplementation(async (url, options) => options.method === 'POST' ? response({ message: 'Đã quá hạn nộp bài.', code: 'DEADLINE_PASSED' }, 409) : response({}, 404));
  const user = userEvent.setup(); renderSubmission();
  const input = await screen.findByLabelText('Nội dung bài làm');
  await user.type(input, 'Câu trả lời chưa được lưu'); await user.click(screen.getByRole('button', { name: 'Nộp bài' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Đã quá hạn nộp bài.'); expect(input).toHaveValue('Câu trả lời chưa được lưu');
});

it('uses Vietnam time consistently and enforces bcrypt byte limits', () => {
  expect(dateInput('2026-12-01T16:59:00Z')).toBe('2026-12-01T23:59');
  expect(dateToISO('2026-12-01T23:59')).toBe('2026-12-01T16:59:00.000Z');
  expect(passwordValid('á'.repeat(36))).toBe(true); expect(passwordValid('á'.repeat(37))).toBe(false);
});
