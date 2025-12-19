'use client';

import { useMemo } from 'react';
import { FaLayerGroup, FaSitemap, FaClipboardList, FaCheckCircle, FaClock } from 'react-icons/fa';

interface CourseTypeLite {
  id: string;
  name: string;
  color?: string;
  parentId?: string | null;
  parent_id?: string | null;
  parentCourseTypeId?: string | null;
  usageCount?: number;
  usage_count?: number;
  childCount?: number;
  child_count?: number;
}

interface CurriculumCourseLite {
  courseType?: {
    id?: string;
    name?: string;
    color?: string;
  } | null;
  credits: number;
}

interface PoolsListsTabProps {
  curriculumId: string;
  curriculumName?: string;
  departmentId?: string;
  courseTypes: CourseTypeLite[];
  courses: CurriculumCourseLite[];
  isLoadingCourseTypes?: boolean;
}

interface CourseTypeNode extends CourseTypeLite {
  children: CourseTypeNode[];
}

const normalizeParentId = (type: CourseTypeLite) =>
  type.parentId ?? type.parent_id ?? type.parentCourseTypeId ?? null;

const buildTree = (types: CourseTypeLite[]): CourseTypeNode[] => {
  const nodeMap = new Map<string, CourseTypeNode>();
  const roots: CourseTypeNode[] = [];

  types.forEach((type) => {
    nodeMap.set(type.id, {
      ...type,
      parentId: normalizeParentId(type),
      children: []
    });
  });

  nodeMap.forEach((node) => {
    if (node.parentId && nodeMap.has(node.parentId)) {
      nodeMap.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortNodes = (list: CourseTypeNode[]): CourseTypeNode[] =>
    [...list]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((node) => ({ ...node, children: sortNodes(node.children) }));

  return sortNodes(roots);
};

const TreeNodeList = ({ nodes, depth = 0 }: { nodes: CourseTypeNode[]; depth?: number }) => {
  if (!nodes.length) {
    return null;
  }

  return (
    <div className="space-y-2">
      {nodes.map((node) => (
        <div key={node.id}>
          <div
            className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-border bg-white dark:bg-gray-900/40 px-3 py-2"
            style={{ marginLeft: depth * 16 }}
          >
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ backgroundColor: node.color || '#6b7280' }}
              ></span>
              <span className="text-sm font-semibold text-foreground">{node.name}</span>
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {(node.usageCount ?? node.usage_count ?? 0)} courses
            </span>
          </div>
          {node.children.length > 0 && <TreeNodeList nodes={node.children} depth={depth + 1} />}
        </div>
      ))}
    </div>
  );
};

export default function PoolsListsTab({
  curriculumId,
  curriculumName,
  departmentId,
  courseTypes,
  courses,
  isLoadingCourseTypes
}: PoolsListsTabProps) {
  const courseTypeTree = useMemo(() => buildTree(courseTypes), [courseTypes]);

  const courseTypeTotals = useMemo(() => {
    const totals = new Map<string, { id: string; name: string; color?: string; credits: number }>();

    courses.forEach((course) => {
      const typeId = course.courseType?.id;
      if (!typeId) {
        return;
      }
      const existing = totals.get(typeId);
      const parsedCredits = typeof course.credits === 'number' ? course.credits : Number(course.credits) || 0;
      if (existing) {
        totals.set(typeId, { ...existing, credits: existing.credits + parsedCredits });
      } else {
        totals.set(typeId, {
          id: typeId,
          name: course.courseType?.name || 'Uncategorized',
          color: course.courseType?.color,
          credits: parsedCredits
        });
      }
    });

    return Array.from(totals.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [courses]);

  const poolChecklist = [
    {
      title: 'Attach Credit Pools',
      body: 'Define per-pool credit totals to replace the legacy Major vs Free split.',
      status: 'blocked'
    },
    {
      title: 'Reuse Course Lists',
      body: 'Attach concentrations, blacklists, and future pools from one place.',
      status: 'blocked'
    },
    {
      title: 'Preview Student Impact',
      body: 'Show how edits change pool satisfaction before publishing.',
      status: 'up-next'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-blue-200 bg-blue-50 dark:border-blue-900/40 dark:bg-blue-950/20 p-4">
        <div className="flex items-start gap-3">
          <FaLayerGroup className="mt-1 text-blue-500" />
          <div>
            <p className="text-sm font-semibold text-blue-800 dark:text-blue-200">
              Pools rollout is active for {curriculumName || 'this curriculum'}
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300">
              Start mapping credit pools and reusable lists now so the Student Checklist can surface pool shortages per student.
            </p>
            <p className="mt-2 text-xs text-blue-600 dark:text-blue-300">
              Curriculum ID: {curriculumId} • Department: {departmentId || 'N/A'}
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <section className="rounded-xl border border-gray-200 dark:border-border bg-gray-50 dark:bg-gray-900/40 p-5">
          <header className="mb-4 flex items-center gap-2 text-foreground">
            <FaSitemap className="text-primary" />
            <div>
              <p className="text-base font-semibold">Course Type Hierarchy</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Pools inherit from these nodes, so keep parents tidy before attaching pools.
              </p>
            </div>
          </header>

          {isLoadingCourseTypes ? (
            <div className="flex items-center justify-center py-10 text-sm text-gray-500 dark:text-gray-400">
              Loading course types...
            </div>
          ) : courseTypeTree.length ? (
            <TreeNodeList nodes={courseTypeTree} />
          ) : (
            <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 bg-white/60 dark:bg-transparent px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
              No course types yet. Create root nodes in the Config page to unlock pool targeting.
            </div>
          )}
        </section>

        <section className="rounded-xl border border-gray-200 dark:border-border bg-white dark:bg-card p-5">
          <header className="mb-4 flex items-center gap-2 text-foreground">
            <FaLayerGroup className="text-primary" />
            <div>
              <p className="text-base font-semibold">Credit Pools Checklist</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                These steps go live once the `/credit-pools` endpoints are deployed.
              </p>
            </div>
          </header>

          <div className="space-y-3">
            {poolChecklist.map((item) => (
              <div
                key={item.title}
                className="rounded-lg border border-gray-200 dark:border-border px-4 py-3"
              >
                <div className="flex items-center gap-2">
                  {item.status === 'blocked' ? (
                    <FaClock className="text-amber-500" />
                  ) : (
                    <FaCheckCircle className="text-emerald-500" />
                  )}
                  <p className="text-sm font-semibold text-foreground">{item.title}</p>
                </div>
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{item.body}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-xl border border-gray-200 dark:border-border bg-white dark:bg-card p-5">
        <header className="mb-4 flex items-center gap-2 text-foreground">
          <FaClipboardList className="text-primary" />
          <div>
            <p className="text-base font-semibold">Reusable Lists Snapshot</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Concentrations, blacklists, and future pool lists will all attach here.
            </p>
          </div>
        </header>
        {courseTypeTotals.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {courseTypeTotals.map((type) => (
              <div
                key={type.id}
                className="rounded-lg border border-gray-200 dark:border-border bg-gray-50 dark:bg-gray-900/40 px-4 py-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: type.color || '#6b7280' }}
                    ></span>
                    <p className="text-sm font-semibold text-foreground">{type.name}</p>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{type.credits} credits</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-lg border border-dashed border-gray-300 dark:border-gray-700 px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
            Once courses have course types, we will summarize how many credits flow through each list entry.
          </p>
        )}
      </section>
    </div>
  );
}
