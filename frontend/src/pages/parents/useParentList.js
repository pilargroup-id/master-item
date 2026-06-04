import { useState, useEffect, useCallback } from 'react';
import parentsService from '../../services/parentsService';

export default function useParentList() {
  const [parents,    setParents]    = useState([]);
  const [search,     setSearch]     = useState('');
  const [page,       setPage]       = useState(1);
  const [pageSize,   setPageSize]   = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState(null);
  const [tick,       setTick]       = useState(0); // trigger manual refetch

  // Satu effect — tidak ada double call
  useEffect(() => {
    setLoading(true);
    setError(null);

    const timer = setTimeout(async () => {
      try {
        const res = await parentsService.list({ search, page, limit: pageSize });
        if (res.data.success) {
          const { data, pagination } = res.data;
          setParents(data);
          setTotalPages(pagination?.totalPages || 1);
          setTotalItems(pagination?.total      || 0);
        }
      } catch (err) {
        setError('Gagal memuat data. Periksa koneksi server.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search, page, pageSize, tick]);

  // Setter yang langsung reset halaman saat filter berubah
  const handleSetSearch   = useCallback((val)  => { setSearch(val);   setPage(1); }, []);
  const handleSetPageSize = useCallback((size) => { setPageSize(size); setPage(1); }, []);
  const refetch           = useCallback(() => setTick((t) => t + 1), []);

  return {
    parents, loading, error, totalItems, totalPages, page, pageSize, search,
    setSearch: handleSetSearch,
    setPage,
    setPageSize: handleSetPageSize,
    refetch,
  };
}
