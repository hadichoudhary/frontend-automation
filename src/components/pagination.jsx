import style from '../css/pagination.module.css';

const Pagination = ({ totalPosts, postPerPage, setCurrentPage, currentPage }) => { // Fixed: setCurentPage → setCurrentPage

    const totalPages = Math.ceil(totalPosts / postPerPage);
    const pages = [];

    for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
    }

    return (
        <div className={style.paginationContainer}>

            <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)} // Fixed here too
                className={style.pageBtn}
            >
                Previous
            </button>

            <button className={style.pageshow}>
                {currentPage} of {totalPages}
            </button>

            <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)} // Fixed here too
                className={style.pageBtn}
            >
                Next
            </button>

        </div>
    );
};

export default Pagination;