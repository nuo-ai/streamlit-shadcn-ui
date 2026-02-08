import {
    Pagination,
    PaginationContent,
    PaginationEllipsis,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
} from "@/components/ui/pagination";

import { forwardRef, useState, useEffect } from "react";
import { Streamlit } from "streamlit-component-lib";

interface StPaginationProps {
  totalPages: number;
  initialPage?: number;
  siblingCount?: number; // Number of page buttons to show on each side of active page
}
  
export const StPagination = forwardRef<HTMLDivElement, StPaginationProps>(
  (props: StPaginationProps, ref) => {
    const { totalPages=3, initialPage = 1, siblingCount = 1 } = props;
    const safeTotalPages = Number.isFinite(totalPages) ? Math.max(1, Math.floor(totalPages)) : 1;
    const safeSiblingCount = Number.isFinite(siblingCount) ? Math.max(0, Math.floor(siblingCount)) : 1;
    const safeInitialPage = Number.isFinite(initialPage)
      ? Math.min(safeTotalPages, Math.max(1, Math.floor(initialPage)))
      : 1;
    const [activePage, setActivePage] = useState<number>(safeInitialPage);
    
    useEffect(() => {
      Streamlit.setComponentValue(activePage);
    }, [activePage]);

    useEffect(() => {
      setActivePage((prevPage) => Math.min(safeTotalPages, Math.max(1, prevPage)));
    }, [safeTotalPages]);

    const renderPageLinks = () => {
      const pageLinks = [];
      
      // If total pages is small enough, show all pages
      if (safeTotalPages <= safeSiblingCount * 2 + 5) {
        for (let i = 1; i <= safeTotalPages; i++) {
          pageLinks.push(
            <PaginationItem key={i}>
              <PaginationLink
                href="#"
                isActive={activePage === i}
                onClick={(e) => {
                  e.preventDefault(); 
                  setActivePage(i); 
                }}
              >
                {i}
              </PaginationLink>
            </PaginationItem>
          );
        }
        return pageLinks;
      }
      
      // Smart pagination for large page counts
      // Calculate range of pages to show around active page
      let startPage = Math.max(2, activePage - safeSiblingCount);
      let endPage = Math.min(safeTotalPages - 1, activePage + safeSiblingCount);
      
      // Adjust range if we're near the edges to maintain consistent count
      if (activePage <= safeSiblingCount + 2) {
        endPage = Math.min(safeTotalPages - 1, safeSiblingCount * 2 + 2);
      } else if (activePage >= safeTotalPages - safeSiblingCount - 1) {
        startPage = Math.max(2, safeTotalPages - safeSiblingCount * 2 - 1);
      }

      const showLeftEllipsis = startPage > 2;
      const showRightEllipsis = endPage < safeTotalPages - 1;
      
      // First page
      pageLinks.push(
        <PaginationItem key={1}>
          <PaginationLink
            href="#"
            isActive={activePage === 1}
            onClick={(e) => {
              e.preventDefault();
              setActivePage(1);
            }}
          >
            1
          </PaginationLink>
        </PaginationItem>
      );
      
      // Left ellipsis
      if (showLeftEllipsis) {
        if (startPage === 3) {
          pageLinks.push(
            <PaginationItem key={2}>
              <PaginationLink
                href="#"
                isActive={activePage === 2}
                onClick={(e) => {
                  e.preventDefault();
                  setActivePage(2);
                }}
              >
                2
              </PaginationLink>
            </PaginationItem>
          );
        } else {
          pageLinks.push(
            <PaginationItem key="ellipsis-start">
              <PaginationEllipsis />
            </PaginationItem>
          );
        }
      }
      
      // Middle pages
      for (let i = startPage; i <= endPage; i++) {
        pageLinks.push(
          <PaginationItem key={i}>
            <PaginationLink
              href="#"
              isActive={activePage === i}
              onClick={(e) => {
                e.preventDefault();
                setActivePage(i);
              }}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }
      
      // Right ellipsis
      if (showRightEllipsis) {
        if (endPage === safeTotalPages - 2) {
          pageLinks.push(
            <PaginationItem key={safeTotalPages - 1}>
              <PaginationLink
                href="#"
                isActive={activePage === safeTotalPages - 1}
                onClick={(e) => {
                  e.preventDefault();
                  setActivePage(safeTotalPages - 1);
                }}
              >
                {safeTotalPages - 1}
              </PaginationLink>
            </PaginationItem>
          );
        } else {
          pageLinks.push(
            <PaginationItem key="ellipsis-end">
              <PaginationEllipsis />
            </PaginationItem>
          );
        }
      }
      
      // Last page (if more than 1 page total)
      if (safeTotalPages > 1) {
        pageLinks.push(
          <PaginationItem key={safeTotalPages}>
            <PaginationLink
              href="#"
              isActive={activePage === safeTotalPages}
              onClick={(e) => {
                e.preventDefault();
                setActivePage(safeTotalPages);
              }}
            >
              {safeTotalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }
      
      return pageLinks;
    };

    return (
      // <div ref={ref}>
        <Pagination ref={ref}>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setActivePage((prevPage) => Math.max(1, prevPage - 1));
                }}
              />
            </PaginationItem>

            {renderPageLinks()}

            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  setActivePage((prevPage) => Math.min(safeTotalPages, prevPage + 1));
                }}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      // </div>
    );
  }
);
