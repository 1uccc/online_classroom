import { useCallback, useState } from 'react';
import { Search, ArrowUpRight, BookOpen, SlidersHorizontal } from 'lucide-react';
import { Link } from 'react-router';
import { request, allPages } from '../api/httpClient';
import { useResource } from '../hooks/useResource';
import { useAuth } from '../contexts/AuthContext';
import { CourseCard } from '../components/courses/CourseCard';
import { Button, Empty, ErrorNotice, Loading, PageHeading, Pagination } from '../components/common/UI';

export default function CatalogPage() {
  const { user } = useAuth();
  const [query, setQuery] = useState({ search: '', category: '', page: 1 });
  const [search, setSearch] = useState('');
  const courses = useResource(useCallback(signal => request('/courses', { signal, query: { ...query, limit: 9 } }), [query]));
  const categories = useResource(useCallback(signal => allPages('/categories', { signal }), []));
  return <><PageHeading eyebrow="KHÁM PHÁ & PHÁT TRIỂN" title="Một thế giới kiến thức mới" description="Tìm lớp học phù hợp và bắt đầu hành trình của riêng bạn.">
    {!user ? <Link to="/register" className="btn btn-primary">Tham gia Classroom<ArrowUpRight size={17} /></Link> : null}
  </PageHeading><section className="catalog-banner"><div><span className="eyebrow">HỌC HÔM NAY. TIẾN XA NGÀY MAI.</span><h2>Bước tiếp theo của bạn<br />bắt đầu từ một lớp học.</h2><p>Tài liệu, bài tập và phản hồi từ giảng viên — cùng một nơi.</p></div><div className="banner-illustration" aria-hidden="true"><span className="orbit orbit-one" /><span className="orbit orbit-two" /><BookOpen size={92} strokeWidth={1.1} /><span className="floating-mark">Aa</span><span className="floating-plus">+</span></div></section>
    <form className="filter-bar" onSubmit={event => { event.preventDefault(); setQuery(value => ({ ...value, search: search.trim(), page: 1 })); }}>
      <div className="search-input"><Search size={18} /><input aria-label="Tìm kiếm khóa học" placeholder="Bạn muốn học gì hôm nay?" value={search} onChange={event => setSearch(event.target.value)} /><Button type="submit" variant="secondary">Tìm kiếm</Button></div>
      <label className="filter-select"><SlidersHorizontal size={17} /><select aria-label="Lọc theo danh mục" value={query.category} onChange={event => setQuery(value => ({ ...value, category: event.target.value, page: 1 }))}><option value="">Tất cả danh mục</option>{categories.data?.map(category => <option key={category._id} value={category._id}>{category.name}</option>)}</select></label>
    </form><ErrorNotice error={categories.error} retry={categories.reload} /><div className="section-heading"><h2>Khóa học dành cho bạn</h2><span className="muted">{courses.data ? `${courses.data.pagination.total} khóa học` : 'Đang cập nhật…'}</span></div>
    {courses.loading ? <Loading /> : courses.error ? <ErrorNotice error={courses.error} retry={courses.reload} /> : courses.data.data.length ? <div className="course-grid">{courses.data.data.map(course => <CourseCard key={course._id} course={course} />)}</div> : <Empty title="Chưa tìm thấy khóa học" description={query.search || query.category ? 'Thử thay đổi từ khóa hoặc danh mục để tìm thêm lớp học.' : 'Các lớp học sẽ xuất hiện tại đây khi giảng viên xuất bản.'} />}
    <Pagination pagination={courses.data?.pagination} onChange={page => setQuery(value => ({ ...value, page }))} />
  </>;
}
