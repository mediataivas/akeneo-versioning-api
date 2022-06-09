<?php

namespace Vincit\VersioningApi\Bundle\Controller\Rest;

use Akeneo\Tool\Bundle\VersioningBundle\Doctrine\ORM\VersionRepository;
use Akeneo\UserManagement\Component\Model\UserInterface;
use Doctrine\DBAL\Connection;
use InvalidArgumentException;
use Oro\Bundle\SecurityBundle\SecurityFacade;
use Psr\Log\LoggerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpKernel\Exception\AccessDeniedHttpException;
use Symfony\Component\Routing\Annotation\Route;
use Symfony\Component\Security\Core\Authentication\Token\Storage\TokenStorageInterface;
use Webmozart\Assert\Assert;

class VersioningApiController extends AbstractController
{
    private Connection $connection;
    private LoggerInterface $apiProductAclLogger;
    private SecurityFacade $security;
    private TokenStorageInterface $tokenStorage;
    private VersionRepository $versionRepository;

    public function __construct(
        TokenStorageInterface $tokenStorage,
        SecurityFacade $security,
        LoggerInterface $apiProductAclLogger,
        VersionRepository $versionRepository,
        Connection $connection
    ) {
        $this->tokenStorage = $tokenStorage;
        $this->security = $security;
        $this->apiProductAclLogger = $apiProductAclLogger;
        $this->versionRepository = $versionRepository;
        $this->connection = $connection;
    }
    
    #[Route('/', name: 'version_list', methods: ['GET'])]
    public function listAction(Request $request): JsonResponse {
        $this->denyAccessUnlessAclIsGranted('pim_api_product_list');

        $response = new JsonResponse();

        $type = 'Akeneo\Pim\Enrichment\Component\Product\Model\Product';

        if ($request->query->has('search')) {
            $search = $request->query->get('search');
            $search = json_decode($search, true);
            $qb = $this->connection->createQueryBuilder();
            $qb->select('*')
                ->where($qb->expr()->eq('resource_name', ':resource_name'))
                ->orderBy('id', 'desc')
                ->from('pim_versioning_version');
            if ($request->query->has('pager')) {
                $pager = $request->query->get('pager');
                $pager = json_decode($pager, true);
                $page = $pager['page'] ?? 1;
                $limit = $pager['per_page'] ?? 25;
                $qb->setFirstResult(($page - 1) * $limit);
                $qb->setMaxResults($limit);
            }

            if ($search['logged_at'] ?? false) {
                foreach ($search['logged_at'] as $i => $item) {
                    $condition = false;
                    $value = $item['value'];
                    switch ($item['operator']) {
                        case '=':
                            $condition = $qb->expr()->eq('logged_at', ':logged_at_' . $i);
                            break;
                        case '!=':
                            $condition = $qb->expr()->neq('logged_at', ':logged_at_' . $i);
                            break;
                        case '<':
                            $condition = $qb->expr()->lte('logged_at', ':logged_at_' . $i);
                            break;
                        case '>':
                            $condition = $qb->expr()->gte('logged_at', ':logged_at_' . $i);
                            break;
                        case 'BETWEEN':
                            if (!is_array($item['value']) || count($item['value']) !== 2) {
                                throw new InvalidArgumentException("This operator needs two date values");
                            }
                            $date1 = $item['value'][0];
                            $date2 = $item['value'][1];
                            // Add first date, well, first
                            $condition = $qb->expr()->gte('logged_at', ':logged_at_' . $i . '_1');
                            $qb->andWhere($condition);
                            $qb->setParameter(':logged_at_' . $i . '_1', $date1);
                            // The second date is added the same way as every other condition
                            $condition = $qb->expr()->lte('logged_at', ':logged_at_' . $i);
                            $value = $date2;
                            break;
                        case 'SINCE LAST N DAYS':
                            $condition = $qb->expr()->gte('logged_at', ':logged_at_' . $i);
                            $value = date_format(
                                new \DateTimeImmutable(sprintf('%s days ago', $value)),
                                'Y-m-d H:i:s'
                            );

                    }
                    $condition && $qb->andWhere($condition);
                    $qb->setParameter(':logged_at_' . $i, $value);
                }
            }

            $qb->setParameter(':resource_name', $type);

            if ($search['field'] ?? false) {
                if (!is_array($search['field'])) {
                    $search['field'] = [$search['field']];
                }
            }
            $fieldLikes = [];
            foreach ($search['field'] as $i => $field) {
                $expression = $qb->expr()->like('changeset', ':field_' . $i);
                $fieldLikes[] = $expression;
                $qb->setParameter(':field_' . $i, '%"' . $field . '%');
            }
            if (!empty($fieldLikes)) {
                $qb->andWhere(
                    $qb->expr()->or(
                        ...$fieldLikes
                    )
                );
            }
            $result = [];
            foreach ($qb->execute()->iterateAssociative() as $item) {
                $item['changeset'] = unserialize($item['changeset']);
                /*if ($search['field'] ?? false) {
                    // Check if changeset includes any of the requested fields
                    if (!array_intersect($search['field'], array_keys($item['changeset']))) {
                        continue;
                    }
                }*/
                $result[] = $item;
            }

            $qb->resetQueryPart('select');
            $qb->setMaxResults(null);
            $qb->setFirstResult(0);
            $qb->select('COUNT(*)');
            $tmp = $qb->execute()->fetchNumeric() ?: [];
            $count = reset($tmp);
            $response->setData([
                'total' => (int)$count,
                'items' => $result
            ]);
        }
        return $response;
    }

    private function denyAccessUnlessAclIsGranted(string $acl): void
    {
        if (!$this->security->isGranted($acl)) {
            $user = $this->tokenStorage->getToken()->getUser();
            Assert::isInstanceOf($user, UserInterface::class);

            $this->apiProductAclLogger->warning(sprintf(
                'User "%s" with roles %s is not granted "%s"',
                $user->getUsername(),
                implode(',', $user->getRoles()),
                $acl
            ));

            throw new AccessDeniedHttpException($this->deniedAccessMessage($acl));
        }
    }
    private function deniedAccessMessage(string $acl): string
    {
        return match ($acl) {
            'pim_api_product_list' => 'Access forbidden. You are not allowed to list products.',
            'pim_api_product_edit' => 'Access forbidden. You are not allowed to create or update products.',
            'pim_api_product_remove' => 'Access forbidden. You are not allowed to delete products.',
            default => 'Access forbidden.',
        };
    }
}
