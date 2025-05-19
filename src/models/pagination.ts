interface PaginatedResult<T> {
    data: T[];
    pagination: {
        totalCount: number;
        totalPages: number;
        currentPage: number;
        hasNext: boolean;
    };
};

export {
    PaginatedResult
};