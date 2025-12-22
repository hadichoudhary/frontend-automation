import { useEffect, useState } from 'react';
import style from '../css/postPage.module.css';
import { FaFilter } from "react-icons/fa";
import Pagination from '../components/pagination';
import { FaEye } from "react-icons/fa";


const Posts = () => {
  const [data, setData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const postPerPage = 10;

  // Preview state (NEW)
  const [previewPost, setPreviewPost] = useState(null);

  // Filter states
  const [showFilters, setShowFilters] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const token = localStorage.getItem("authToken");
        if (!token) return;

        const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/post/getPosts`,
          {
            method: "GET",
            headers: {
              "Authorization": `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        if (response.status === 401) {
          localStorage.removeItem("authToken");
          return;
        }

        const result = await response.json();
        const posts = result.data || [];
        setData(posts);
        setFilteredData(posts);

      } catch (error) {
        console.log("Fetch posts error:", error);
      }
    };

    fetchPosts();
  }, []);

  const parseDDMMYYYY = (d) => {
    if (!d) return null;
    const [day, month, year] = d.split("/").map(Number);
    return new Date(year, month - 1, day);
  };

  const applyFilters = () => {
    let filtered = [...data];

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        item =>
          item.status &&
          item.status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    if (fromDate) {
      const from = new Date(fromDate);
      filtered = filtered.filter(item => {
        const itemDate = parseDDMMYYYY(item.date);
        return itemDate && itemDate >= from;
      });
    }

    if (toDate) {
      const to = new Date(toDate);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter(item => {
        const itemDate = parseDDMMYYYY(item.date);
        return itemDate && itemDate <= to;
      });
    }

    setFilteredData(filtered);
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFromDate('');
    setToDate('');
    setStatusFilter('all');
    setFilteredData(data);
    setCurrentPage(1);
  };

  const lastPostIndex = currentPage * postPerPage;
  const firstPostIndex = lastPostIndex - postPerPage;
  const currentPosts = filteredData.slice(firstPostIndex, lastPostIndex);

  return (
    <div className={style.postContainer}>

      {previewPost && (
        <div className={style.previewOverlay}>
          <div className={style.previewModal}>
            <h3>Post Preview</h3>

            <div className={style.previewSection}>
              <h4>LinkedIn Preview</h4>
              <div className={style.previewContent}>
                {previewPost.output}
              </div>
            </div>

            {previewPost.facebookOutPut &&
              previewPost.facebookOutPut.trim() !== "" && (
                <div className={style.previewSection}>
                  <h4>Facebook Preview</h4>
                  <div className={style.previewContent}>
                    {previewPost.facebookOutPut}
                  </div>
                </div>
              )
            }

            <button
              className={style.closeBtn}
              onClick={() => setPreviewPost(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <div className={style.headerContainer}>
        <div className={style.postHeader}>
          <h1>Posts</h1>
          <p>Showing {filteredData.length} posts</p>
        </div>

        <div
          className={style.tableFilter}
          onClick={() => setShowFilters(!showFilters)}
          style={{ cursor: 'pointer' }}
        >
          <FaFilter style={{ marginRight: '1rem' }} />
          <p>Filters {showFilters ? '▲' : '▼'}</p>
        </div>
      </div>

      {showFilters && (
        <div className={style.filterSection}>
          <div className={style.filterGroup}>
            <label>From Date:</label>
            <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
          </div>

          <div className={style.filterGroup}>
            <label>To Date:</label>
            <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
          </div>

          <div className={style.filterGroup}>
            <label>Status:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="approved">Approved</option>
              <option value="published">Published</option>
              <option value="scheduled">Scheduled</option>
              <option value="draft">Draft</option>
              <option value="failed">Failed</option>
            </select>

          </div>

          <div className={style.filterButtons}>
            <button onClick={applyFilters} className={style.applyBtn}>Apply Filters</button>
            <button onClick={clearFilters} className={style.clearBtn}>Clear Filters</button>
          </div>
        </div>
      )}

      <div className={style.postTable}>
        <table className={style.table}>
          <thead>
            <tr>
              <th>ID</th>
              <th>Date</th>
              <th>Time</th>
              <th>Content</th>
              <th>Status</th>
              <th>Preview</th> {/* NEW */}
            </tr>
          </thead>

          <tbody>
            {currentPosts.length > 0 ? (
              currentPosts.map((item, index) => {
                const displayIndex = firstPostIndex + index + 1;
                const canPreview =
                  ["draft", "published", "approved"].includes(
                    item.status?.toLowerCase()
                  );

                return (
                  <tr key={item._id || index}>
                    <td>{item.Id || displayIndex}</td>
                    <td>{item.date}</td>
                    <td>{item.time}</td>
                    <td>{item.contentTopic}</td>
                    <td className={style.statusCell}>
                      <span className={`${style.statusBadge} ${style[item.status?.toLowerCase()]}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className={style.previewLogo}>
                      {canPreview && (
                        <FaEye
                          className={style.previewIcon}
                          title="Preview post"
                          onClick={() => setPreviewPost(item)}
                          style={{ cursor: "pointer" }}
                        />
                      )}
                    </td>


                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" style={{ textAlign: 'center' }}>
                  No posts found
                </td>
              </tr>
            )}
          </tbody>
        </table>

        <Pagination
          totalPosts={filteredData.length}
          postPerPage={postPerPage}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
        />
      </div>
    </div>
  );
};

export default Posts;
