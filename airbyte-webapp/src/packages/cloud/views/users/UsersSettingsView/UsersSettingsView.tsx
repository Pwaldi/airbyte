import React, { useMemo } from "react";
import { FormattedMessage } from "react-intl";
import { CellProps } from "react-table";

import { Button, H5, LoadingButton } from "components";
import Table from "components/Table";

import { useConfirmationModalService } from "hooks/services/ConfirmationModal";
import { useCurrentWorkspace } from "hooks/services/useWorkspace";
import { User } from "packages/cloud/lib/domain/users";
import { useAuthService } from "packages/cloud/services/auth/AuthService";
import {
  InviteUsersModalServiceProvider,
  useInviteUsersModalService,
} from "packages/cloud/services/users/InviteUsersModalService";
import { useListUsers, useUserHook } from "packages/cloud/services/users/UseUserHook";

import styles from "./UsersSettingsView.module.scss";

const RemoveUserSection: React.VFC<{ workspaceId: string; email: string }> = ({ workspaceId, email }) => {
  const { openConfirmationModal, closeConfirmationModal } = useConfirmationModalService();
  const { removeUserLogic } = useUserHook();
  const { isLoading, mutate: removeUser } = removeUserLogic;

  const onRemoveUserButtonClick = () => {
    openConfirmationModal({
      text: `modals.removeUser.text`,
      title: `modals.removeUser.title`,
      submitButtonText: "modals.removeUser.button.submit",
      onSubmit: async () => {
        removeUser({ email, workspaceId });
        closeConfirmationModal();
      },
      submitButtonDataId: "remove",
    });
  };

  return (
    <LoadingButton secondary onClick={onRemoveUserButtonClick} isLoading={isLoading}>
      <FormattedMessage id="userSettings.user.remove" />
    </LoadingButton>
  );
};

const Header: React.VFC = () => {
  const { toggleInviteUsersModalOpen } = useInviteUsersModalService();
  return (
    <div className={styles.header}>
      <H5>
        <FormattedMessage id="userSettings.table.title" />
      </H5>
      <Button
        onClick={() => {
          toggleInviteUsersModalOpen();
        }}
        data-testid="userSettings.button.addNewUser"
      >
        + <FormattedMessage id="userSettings.button.addNewUser" />
      </Button>
    </div>
  );
};

const UsersTable: React.VFC = () => {
  const { workspaceId } = useCurrentWorkspace();
  const users = useListUsers();
  const { user } = useAuthService();

  const columns = useMemo(
    () => [
      {
        Header: <FormattedMessage id="userSettings.table.column.fullname" />,
        headerHighlighted: true,
        accessor: "name",
        Cell: ({ cell }: CellProps<User>) => cell.value,
      },
      {
        Header: <FormattedMessage id="userSettings.table.column.email" />,
        headerHighlighted: true,
        accessor: "email",
        Cell: ({ cell }: CellProps<User>) => cell.value,
      },
      // TEMP: Currently all cloud users are admins.
      // Remove when there is more than role
      // {
      //   Header: (
      //     <>
      //       <FormattedMessage id="userSettings.table.column.role" />
      //       <RoleToolTip />
      //     </>
      //   ),
      //   headerHighlighted: true,
      //   accessor: "userId",
      //   Cell: (_: CellProps<User>) => "Admin",
      // },
      {
        Header: <FormattedMessage id="userSettings.table.column.action" />,
        headerHighlighted: true,
        accessor: "status",
        Cell: ({ row }: CellProps<User>) =>
          [
            user?.userId !== row.original.userId ? (
              <RemoveUserSection workspaceId={workspaceId} email={row.original.email} />
            ) : null,
            // cell.value === "invited" && <Button secondary>send again</Button>,
          ].filter(Boolean),
      },
    ],
    [workspaceId, user]
  );

  return <Table data={users ?? []} columns={columns} />;
};

export const UsersSettingsView: React.VFC = () => (
  <InviteUsersModalServiceProvider>
    <Header />
    <UsersTable />
  </InviteUsersModalServiceProvider>
);
